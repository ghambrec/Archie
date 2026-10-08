import { Component, inject, signal } from '@angular/core';
import { Users } from '../users';
import { email, form, minLength, required, FormRoot, FormField } from '@angular/forms/signals';
import { firstValueFrom, timer } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe } from '@jsverse/transloco';

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
			minLength(schemaPath.password, 8, {
			message: 'users.createUser.errors.passwordMinLength',
			});

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
						const reponse = await firstValueFrom(this.usersService.create(formValues));
						this.feedbackMsg.set('users.createUser.feedbackMsg');
						await firstValueFrom(timer(500));
						this.activeModal.close();
						return;
					} catch (error : any) {
						let translocoKey = error.status == 409 ? "users.createUser.errors.Conflict" : "users.createUser.errorGeneral";
						if (translocoKey == "users.createUser.errors.Conflict" && error.error?.message.toLowerCase().includes("mail")) {
							translocoKey = "users.createUser.errors.ConflictMail"
						} else if (translocoKey == "users.createUser.errors.Conflict" && error.error?.message.toLowerCase().includes("name")) {
							translocoKey = "users.createUser.errors.ConflictName"
						} else {
							translocoKey = "users.createUser.errors.General";
						}
						return { kind: 'serverError', message: translocoKey };
					}
				}
			}
		}
	)
}
