import { Component, inject, signal } from '@angular/core';
import { form, FormRoot, maxLength, minLength, pattern, required } from '@angular/forms/signals';
import { TranslocoPipe } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { TextFormField } from '../../shared/form-field/form-field';
import { Users } from '../../users/users';
import { PASSWORD_POLICY } from '../../validation/password-policy';

@Component({
  selector: 'app-profile-security',
  imports: [FormRoot, TextFormField, TranslocoPipe],
  templateUrl: './profile-security.html',
})
export class ProfileSecurity {
  private readonly users = inject(Users);
  readonly passwordModel = signal({ password: '' });
  readonly passwordSaveMessage = signal<string | null>(null);

  readonly passwordForm = form(this.passwordModel, (path) => {
    required(path.password, { message: 'profile.security.required' });
    minLength(path.password, PASSWORD_POLICY.minLength, { message: 'profile.security.minLength' });
    maxLength(path.password, PASSWORD_POLICY.maxLength, { message: 'profile.security.maxLength' });
    pattern(path.password, PASSWORD_POLICY.pattern, { message: 'profile.security.pattern' });
  }, {
    submission: {
      action: async (field) => this.savePassword(field().value().password),
    },
  });

  private async savePassword(password: string) {
    this.passwordSaveMessage.set(null);
    try {
      await firstValueFrom(this.users.changeOwnPassword(password));
      this.passwordForm().reset({ password: '' });
      this.passwordSaveMessage.set('profile.security.success');
      return;
    } catch {
      return { kind: 'serverError', message: 'profile.security.error' };
    }
  }
}
