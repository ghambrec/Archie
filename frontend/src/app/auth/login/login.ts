import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Auth } from '../auth';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

@Component({
	selector: 'app-login',
	imports: [TranslocoPipe, FormRoot, FormField],
	templateUrl: './login.html',
	styleUrl: './login.scss',
})
export class Login {
	private readonly authService = inject(Auth);
	private readonly router = inject(Router);
	private readonly translocoService = inject(TranslocoService); 

	loginModel = signal({
		email: '',
		password: '',
	});

	loginForm = form (
		this.loginModel,
		(p) => {
			required(p.email, { message: 'email is mandatory' });
			email(p.email, { message: 'please enter valid email' });

			required(p.password, { message: 'password is mandatory' });
		},
		{
			submission: {
				action: async (field) => {
					try {
						await firstValueFrom(this.authService.login(field().value()),
						);
						const user = await firstValueFrom(this.authService.getCurrentUser(),
						);
						this.authService.currentUser.set(user);
						this.translocoService.setActiveLang(user.preferredLanguage);
						this.router.navigateByUrl('/home');
						return

					} catch (error : any) {
						const translocoKey = error.status == 401 ? 'login.errorInvalidCred' : 'login.errorGeneral';
						return { kind: 'serverError', message: translocoKey };
					}
				}
			}
		}
	);
}
