import { Component, inject, signal } from '@angular/core';
import { Users } from '../users';
import { email, form, minLength, required, FormRoot, FormField } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-create-user-modal',
	imports: [FormRoot, FormField],
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
						await firstValueFrom(this.usersService.create(field().value()));
						this.feedbackMsg.set('user successfully created');
						return;
					} catch (error : any) {
						return { kind: 'serverError', message: error.error?.message ?? 'user could not get created' };
					}
				}
			}
		}
	)
}
