import { Component, effect, inject, input, output, signal } from '@angular/core';
import { email, form, FormRoot, maxLength, pattern, required } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { TextFormField } from '../../shared/form-field/form-field';
import { SUPPORTED_LANGUAGE_PATTERN } from '../../core/i18n/supported-language';
import { DISPLAY_NAME_MAX_LENGTH } from '../../validation/display-name-policy';
import { Users, type EditUserForm, type PatchUser } from '../../users/users';
import type { ProfileUser } from '../profile';

type ProfileEditFormInput = Pick<EditUserForm, 'email' | 'displayName'> & {
  preferredLanguage: string;
};

@Component({
  selector: 'app-profile-edit-form',
  imports: [FormRoot, TextFormField, TranslocoPipe],
  templateUrl: './profile-edit-form.html',
  styleUrl: './profile-edit-form.scss',
})
export class ProfileEditForm {
  private readonly usersService = inject(Users);
  readonly profile = input.required<ProfileUser>();
  readonly avatarUrl = input('images/default-avatar.svg');
  readonly avatarError = output<Event>();
  readonly saveMessage = signal<string | null>(null);

  readonly profileEditModel = signal<ProfileEditFormInput>({
    email: '',
    displayName: '',
    preferredLanguage: 'en',
  });

  readonly profileEditForm = form(this.profileEditModel, (path) => {
    maxLength(path.displayName, DISPLAY_NAME_MAX_LENGTH, { message: 'users.updateUser.errors.displayNameTooLong' });
    email(path.email, { message: 'users.updateUser.errors.emailFormat' });
    pattern(path.preferredLanguage, SUPPORTED_LANGUAGE_PATTERN, { message: 'users.updateUser.errors.unsupportedLanguage' });
    required(path.displayName, { message: 'users.updateUser.errors.displayNameRequired' });
    required(path.email, { message: 'users.updateUser.errors.emailRequired' });
    required(path.preferredLanguage, { message: 'users.updateUser.errors.languageRequired' });
  }, {
    submission: {
      action: async (field) => this.save(field().value()),
    },
  });

  constructor() {
    effect(() => {
      const user = this.profile();
      this.profileEditModel.set({
        email: user.email,
        displayName: user.displayName,
        preferredLanguage: user.preferredLanguage,
      });
    });
  }

  private async save(values: ProfileEditFormInput) {
    this.saveMessage.set(null);
    const user = this.profile();
    const changes: PatchUser = {};
    const email = values.email.trim().toLowerCase();
    const displayName = values.displayName.trim();
    const preferredLanguage = values.preferredLanguage.trim().toLowerCase();

    if (email !== user.email.trim().toLowerCase()) changes.email = email;
    if (displayName !== user.displayName.trim()) changes.displayName = displayName;
    if (preferredLanguage !== user.preferredLanguage) changes.preferredLanguage = preferredLanguage;

    try {
      await firstValueFrom(this.usersService.update(user.id, changes));
      const updatedUser = await firstValueFrom(this.usersService.getCurrentUser());
      this.usersService.currentUser.set(updatedUser);
      this.saveMessage.set('profile.edit.success');
      return;
    } catch (error: unknown) {
      const code = error instanceof HttpErrorResponse ? error.error?.code : undefined;
      let message = 'profile.edit.error';
      switch (code) {
        case 'AUTH_EMAIL_ALREADY_REGISTERED':
        case 'USER_NAME_ALREADY_REGISTERED':
        case 'VALIDATION_FAILED':
        case 'INTERNAL_SERVER_ERROR':
          message = `errors.${code}`;
          break;
        case 'UNSUPPORTED_LANGUAGE':
          message = 'users.updateUser.errors.unsupportedLanguage';
          break;
      }
      return { kind: 'serverError', message };
    }
  }
}
