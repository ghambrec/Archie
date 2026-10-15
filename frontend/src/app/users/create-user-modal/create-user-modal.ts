import { Component, inject, signal } from '@angular/core';
import { Users } from '../users';
import { email, form, minLength, required, FormRoot, FormField } from '@angular/forms/signals';
import { firstValueFrom, timer } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe } from '@jsverse/transloco';
import { PASSWORD_POLICY } from '../../validation/password-policy';
import { DISPLAY_NAME_MAX_LENGTH } from '../../validation/display-name-policy';
import { maxLength } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';


@Component({
	selector: 'app-create-user-modal',
	imports: [FormRoot, FormField, TranslocoPipe],
	templateUrl: './create-user-modal.html',
	styleUrl: './create-user-modal.scss',
})
export class CreateUserModal {
	protected readonly activeModal = inject(NgbActiveModal);
	private readonly usersService = inject(Users);

	readonly feedbackMsg = signal<string | null>(null);

	createUserModel = signal({
		email: '',
		password: '',
		displayName: '',
	});

	createUserForm = form(
		this.createUserModel,
		(schemaPath) => {
			required(schemaPath.email, {
			message: 'users.createUser.errors.emailRequired',
			});
			email(schemaPath.email, {
			message: 'users.createUser.errors.emailFormat',
			});

			required(schemaPath.password, {
			message: 'users.createUser.errors.passwordRequired',
			});
			minLength(schemaPath.password, PASSWORD_POLICY.minLength, {
			message: 'users.createUser.errors.passwordMinLength',
			});
			
			maxLength(schemaPath.displayName, DISPLAY_NAME_MAX_LENGTH, { message: 'users.updateUser.errors.displayNameTooLong'})
			required(schemaPath.displayName, {
			message: 'users.createUser.errors.displayNameRequired',
			});
		},
		{
			submission: {
				action: async (field) => {
					this.feedbackMsg.set(null);
					try {
						const formValues = field().value();
		
						await firstValueFrom(this.usersService.create(formValues));
						this.feedbackMsg.set('users.createUser.feedbackMsg');
						await firstValueFrom(timer(500));
						this.activeModal.close();
						return;
					} catch (error: unknown) {
  						let message = 'users.createUser.errors.General';

  						if (error instanceof HttpErrorResponse) {
  						  switch (error.error?.code) {
  						    case 'AUTH_EMAIL_ALREADY_REGISTERED':
  						      message = 'errors.AUTH_EMAIL_ALREADY_REGISTERED';
  						      break;
  						    case 'USER_NAME_ALREADY_REGISTERED':
  						      message = 'errors.USER_NAME_ALREADY_REGISTERED';
  						      break;
  						    case 'VALIDATION_FAILED':
  						      message = 'errors.VALIDATION_FAILED';
  						      break;
  						    default:
  						      if (error.status === 409) {
  						        message = 'users.createUser.errors.Conflict';
  						      }
  							 }
						}
						return { kind: 'serverError', message };
  					}
				}
			}
		}
	)
}
