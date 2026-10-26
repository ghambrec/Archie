import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { Users } from '../users/users';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DatePipe } from '@angular/common';
import { UserPermission } from '../groups/groups';
import { environment } from '../../environments/environment';

interface ProfileUser {
  id: string;
  email: string;
  displayName: string;
  preferredLanguage: string;
  isActive?: boolean;
  isAdmin: boolean;
}

@Component({
  selector: 'app-profile',
  imports: [NgbNavModule, DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnDestroy {
  private readonly users = inject(Users);
  private readonly http = inject(HttpClient);

  readonly userGroups = signal<Array<{
    groupId: string;
    name: string;
    joinedAt: string;
    permissions: string[];
  }>>([]);

  private avatarObjectUrl?: string;

  // Expliziter Return-Type: ProfileUser
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
    
    // CurrentUser hat kein isActive --> Default false
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      preferredLanguage: u.preferredLanguage,
      isActive: true, // oder false, falls backend es nicht liefert
      isAdmin: u.isAdmin,
    };
  });

  avatarUrl = `images/default-avatar.svg`;

  constructor() {
    // laeuft jedes mal wenn currentUser() sich aendert (auch initial)
    effect(() => {
      const user = this.users.currentUser();
      if (user) {
        console.log('[Profile] Effect triggered for user:', user.id);
        this.loadAvatar(user.id);
        this.loadUserGroups(user.id)
      } else {
        this.avatarUrl = 'images/default-avatar.svg';
        this.userGroups.set([]);
      }
    });

    // 2. inital user load -  bei coldstart
    if (!this.users.currentUser()) {
      this.users.getCurrentUser().subscribe({
        next: (user) => this.users.currentUser.set(user),
        error: () => this.avatarUrl = 'images/default-avatar.svg',
      });
    }
  }

  // ngOnInit(): void {
  //   if (!this.users.currentUser()) {
  //     this.users.getCurrentUser().subscribe({
  //       next: (user) => {
  //         this.users.currentUser.set(user);
  //         // this.loadAvatar(user.id);
  //       },
  //       error: () => this.avatarUrl = 'images/default-avatar.svg',
  //     });
  //   }
  // }

  private loadAvatar(userId: string): void {
    const url = this.users.getAvatarUrl(userId);
    console.log('[Profile] Loading avatar:', url);

    this.http.get(url, { responseType: 'blob', withCredentials: true }).subscribe({
      next: (blob) => {
        console.log('[Profile] Blob:', blob.type, blob.size);
        this.avatarObjectUrl = URL.createObjectURL(blob);
        this.avatarUrl = this.avatarObjectUrl;
      },
      error: (err) => {
        console.error('[Profile] Avatar error:', err);
        this.avatarUrl = 'images/default-avatar.svg';
      },
    });
  }

  private async loadUserGroups(userId: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.users.getUserGroups(userId));

      const groupsWithPermissions = await Promise.all(response.groups.map(async group => {
        const permissions = await firstValueFrom(
          this.http.get<UserPermission[]>(
            `${environment.apiUrl}/user-permission/${group.groupId}/permissions`,
            {
              withCredentials: true,
            }
          )
        );
        return {
          ...group,
          permissions: permissions.filter(permission => permission.userId === userId)
          .map(permission => permission.permKey),
        };
      })
    );

    this.userGroups.set(groupsWithPermissions);
    } catch (error) {
      console.error('[Profile] Failed to load user groups:', error);
      this.userGroups.set([]);
    }
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = 'images/default-avatar.svg';
  }

  ngOnDestroy(): void {
    this.avatarObjectUrl && URL.revokeObjectURL(this.avatarObjectUrl);
  }
} 