import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-profile-security',
  imports: [FormsModule, TranslocoPipe],
  templateUrl: './profile-security.html',
})
export class ProfileSecurity {
  readonly editPassword = model('');
  readonly isPasswordSaving = input(false);
  readonly passwordSaveMessage = input<string | null>(null);
  readonly passwordSaveError = input<string | null>(null);
  readonly saveRequested = output<void>();
}
