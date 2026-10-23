import { Component, inject, signal } from '@angular/core';
import { email, form, FormRoot, maxLength, minLength, required } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom, timer } from 'rxjs';
import { TextFormField } from '../../shared/form-field/form-field';
import { DISPLAY_NAME_MAX_LENGTH } from '../../validation/display-name-policy';
import { PASSWORD_POLICY } from '../../validation/password-policy';
import { Users } from '../users';

@Component({
  selector: 'app-create-user-modal',
  imports: [FormRoot, TextFormField, TranslocoPipe],
  templateUrl: './create-user-modal.html',
  styleUrl: './create-user-modal.scss',
})
export class CreateUserModal {
  protected readonly activeModal = inject(NgbActiveModal);
  private readonly usersService = inject(Users);
  readonly feedbackMsg = signal<string | null>(null);

  readonly createUserModel = signal({ email: '', password: '', displayName: '' });

  readonly createUserForm = form(this.createUserModel, (path) => {
    required(path.email, { message: 'users.createUser.errors.emailRequired' });
    email(path.email, { message: 'users.createUser.errors.emailFormat' });
    required(path.password, { message: 'users.createUser.errors.passwordRequired' });
    minLength(path.password, PASSWORD_POLICY.minLength, { message: 'users.createUser.errors.passwordMinLength' });
    maxLength(path.displayName, DISPLAY_NAME_MAX_LENGTH, { message: 'users.createUser.errors.displayNameTooLong' });
    required(path.displayName, { message: 'users.createUser.errors.displayNameRequired' });
  }, {
    submission: {
      action: async (field) => {
        this.feedbackMsg.set(null);
        try {
          await firstValueFrom(this.usersService.create(field().value()));
          this.feedbackMsg.set('users.createUser.feedbackMsg');
          await firstValueFrom(timer(500));
          this.activeModal.close();
          return;
        } catch (error: unknown) {
          let message = 'users.createUser.errors.General';
          if (error instanceof HttpErrorResponse) {
            switch (error.error?.code) {
              case 'AUTH_EMAIL_ALREADY_REGISTERED':
              case 'USER_NAME_ALREADY_REGISTERED':
              case 'VALIDATION_FAILED':
                message = `errors.${error.error.code}`;
                break;
              default:
                if (error.status === 409) message = 'users.createUser.errors.Conflict';
            }
          }
          return { kind: 'serverError', message };
        }
      },
    },
  });
}
