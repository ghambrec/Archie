import { TextFormField } from '../../shared/form-field/form-field';
import { Component, inject, signal } from '@angular/core';
import { email, form, FormRoot, maxLength, minLength, pattern, required } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { SUPPORTED_LANGUAGE_PATTERN } from '../../core/i18n/supported-language';
import { DISPLAY_NAME_MAX_LENGTH } from '../../validation/display-name-policy';
import { PASSWORD_POLICY } from '../../validation/password-policy';
import { Users, type EditUserForm, type PatchUser, type UserInfo } from '../users';

type EditUserFormInput = Omit<EditUserForm, 'preferredLanguage'> & {
  preferredLanguage: string;
};

@Component({
  selector: 'app-edit-user-modal',
  imports: [FormRoot, TextFormField, TranslocoPipe],
  templateUrl: './edit-user-modal.html',
  styleUrl: './edit-user-modal.scss',
})
export class EditUserModal {
  selectedUser!: UserInfo;
  protected readonly activeModal = inject(NgbActiveModal);
  private readonly usersService = inject(Users);

  readonly editUserModal = signal<EditUserFormInput>({
    email: '',
    displayName: '',
    preferredLanguage: 'en',
    password: '',
  });

  readonly editUserForm = form(this.editUserModal, (path) => {
    minLength(path.password, PASSWORD_POLICY.minLength, { message: 'users.updateUser.errors.passwordError' });
    pattern(path.password, PASSWORD_POLICY.pattern, {message: 'users.updateUser.erros.passwordError'});
    maxLength(path.password, PASSWORD_POLICY.maxLength, {message: 'users.updateUser.erros.passwordError'})
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

  initialize(user: UserInfo): void {
    this.selectedUser = user;
    this.editUserModal.set({
      email: user.email,
      displayName: user.displayName,
      preferredLanguage: user.preferredLanguage,
      password: '',
    });
  }

  private async save(values: EditUserFormInput) {
    const changes: PatchUser = {};
    const email = values.email.trim().toLowerCase();
    const displayName = values.displayName.trim();
    const preferredLanguage = values.preferredLanguage.trim().toLowerCase();

    if (email !== this.selectedUser.email.trim().toLowerCase()) changes.email = email;
    if (displayName !== this.selectedUser.displayName.trim()) changes.displayName = displayName;
    if (preferredLanguage !== this.selectedUser.preferredLanguage) changes.preferredLanguage = preferredLanguage;
    if (values.password.trim() !== '') changes.password = values.password;

    try {
      await firstValueFrom(this.usersService.update(this.selectedUser.id, changes));
      this.activeModal.close();
      return;
    } catch (error: unknown) {
      const code = error instanceof HttpErrorResponse ? error.error?.code : undefined;
      let message = 'errors.UNKNOWN';
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
