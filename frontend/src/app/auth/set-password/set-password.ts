import { Component, inject, signal } from '@angular/core'
import { Auth } from '../auth'
import { form, FormField, FormRoot, minLength, required } from '@angular/forms/signals';
import { TranslocoPipe } from '@jsverse/transloco';
// import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-set-password',
    imports: [FormRoot, FormField, TranslocoPipe],
    templateUrl: './set-password.html',
    styleUrl: './set-password.scss',
})
export class SetPassword {
    private readonly authService = inject(Auth);
    private readonly activeModal = inject(NgbActiveModal);
    // public readonly router = inject(Router);

    readonly feedbackMsg = signal<string | null>(null);

    model = signal({ password: '', confirmPassword: '' });

    setPasswordForm = form(
        this.model,
        (p) => {
            required(p.password, { message: 'Password is required' });
            minLength(p.password, 8, { message: 'Minimum 8 characters' });
            required(p.confirmPassword, { message: 'Please confirm password' });
        },
        {
            submission: {
                action: async (field) => {
                    this.feedbackMsg.set(null);
                    const { password, confirmPassword } = field().value();

                    if (password !== confirmPassword) {
                        return { kind: 'serverError', message: 'Passwords do not match' };
                    }

                    try {
                        await firstValueFrom(this.authService.setPassword({ password }));
                        this.activeModal.close('password-set');
                        return;
                    } catch {
                        this.feedbackMsg.set('auth.setPassword.errorGeneral');
                        return { kind: 'serverError', message: 'Failed to set password' };
                    }
                }
            }
        }
    )
}