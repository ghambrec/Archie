import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { Users, type CurrentUser, type UserGroupsResponse } from '../users/users';
import { httpResource } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TranslocoPipe } from '@jsverse/transloco';
import { ProfileEditForm } from './profile-edit-form/profile-edit-form';
import { ProfileGroups } from './profile-groups/profile-groups';
import { ProfileSecurity } from './profile-security/profile-security';

export interface ProfileUser {
  id: string;
  email: string;
  displayName: string;
  preferredLanguage: string;
  isActive?: boolean;
  isAdmin: boolean;
}

@Component({
  selector: 'app-profile',
  imports: [
    NgbNavModule,
    ProfileEditForm,
    ProfileGroups,
    ProfileSecurity,
    TranslocoPipe,
  ],
  templateUrl: './profile.html',
})
export class Profile {
  private readonly users = inject(Users);
  private readonly userId = computed(() => this.users.currentUser()?.id);

  readonly currentUserResource = httpResource<CurrentUser>(() => ({
    url: `${environment.apiUrl}/users/me`,
    withCredentials: true,
  }));

  readonly userGroupsResource = httpResource<UserGroupsResponse>(() => this.userId()
    ? { url: `${environment.apiUrl}/user-groups/me`, withCredentials: true }
    : undefined,
  );

  readonly avatarResource = httpResource.blob(() => {
    const userId = this.userId();
    return userId
      ? { url: this.users.getAvatarUrl(userId), withCredentials: true }
      : undefined;
  });

  readonly userGroups = computed(() => this.userGroupsResource.hasValue()
    ? this.userGroupsResource.value().groups
    : [],
  );

  readonly avatarUrl = signal('images/default-avatar.svg');

  readonly profile = computed<ProfileUser>(() => {
    const u = this.users.currentUser();
    if (!u) {
      return {
        id: '',
        email: '',
        displayName: '',
        preferredLanguage: 'en',
        isActive: false,
        isAdmin: false,
      }
    }

    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      preferredLanguage: u.preferredLanguage,
      isActive: true,
      isAdmin: u.isAdmin,
    };
  });

  // Keep the shared user state in sync;
  constructor() {
    effect(() => {
      if (this.currentUserResource.hasValue()) {
        this.users.currentUser.set(this.currentUserResource.value());
      }
    });

    effect((onCleanup) => {
      if (!this.avatarResource.hasValue()) {
        this.avatarUrl.set('images/default-avatar.svg');
        return;
      }

      const objectUrl = URL.createObjectURL(this.avatarResource.value());
      this.avatarUrl.set(objectUrl);
      onCleanup(() => URL.revokeObjectURL(objectUrl));
    });
  }

  onAvatarError(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (image.getAttribute('src') !== 'images/default-avatar.svg') {
      image.src = 'images/default-avatar.svg';
    }
  }
}
