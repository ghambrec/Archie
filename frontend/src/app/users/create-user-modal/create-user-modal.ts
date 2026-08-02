import { Component, inject, signal } from '@angular/core';
import { UserList, Users } from '../users';
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
		(p) => { // p = schemaPath (pointer to the values not the values itself)
			required(p.email, { message: 'email is mandatory' });
			email(p.email, { message: 'please enter valid email' });

			required(p.password, { message: 'password is mandatory' });
			minLength(p.password, 8, { message: 'minlength for password is 8' });

			required(p.displayName, { message: 'displayName is mandatory' });
		},
		{
			submission: {
				action: async (field) => {
					this.feedbackMsg.set(null);
					try {
						const formValues = field().value();
						const reponse = await firstValueFrom(this.usersService.create(formValues));

						const createdUser: UserList = {
							id: reponse.id,
							email: formValues.email,
							displayName: formValues.displayName,
							preferredLanguage: "en",
							lastLogin: "",
							isActive: true,
							avatar: `https://api.dicebear.com/9.x/identicon/svg?seed=${formValues.displayName}`
						}

						this.feedbackMsg.set('users.createUser.feedbackMsg');
						await firstValueFrom(timer(500));
						this.activeModal.close(createdUser);
						return;
					} catch (error : any) {
						let translocoKey = error.status == 409 ? "users.createUser.errorConflict" : "users.createUser.errorGeneral";
						if (translocoKey == "users.createUser.errorConflict" && error.error?.message.toLowerCase().includes("mail")) {
							translocoKey = "users.createUser.errorConflictMail"
						} else if (translocoKey == "users.createUser.errorConflict" && error.error?.message.toLowerCase().includes("name")) {
							translocoKey = "users.createUser.errorConflictName"
						} else {
							translocoKey = "users.createUser.errorGeneral";
						}
						return { kind: 'serverError', message: translocoKey };
					}
				}
			}
		}
	)
}
