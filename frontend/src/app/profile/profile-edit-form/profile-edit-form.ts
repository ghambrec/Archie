import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import type { ProfileUser } from '../profile';

@Component({
  selector: 'app-profile-edit-form',
  imports: [FormsModule, TranslocoPipe],
  templateUrl: './profile-edit-form.html',
  styleUrl: './profile-edit-form.scss',
})
export class ProfileEditForm {
  readonly profile = input.required<ProfileUser>();
  readonly avatarUrl = input('images/default-avatar.svg');
  readonly editDisplayName = model('');
  readonly editEmail = model('');
  readonly editPreferredLanguage = model('en');
  readonly isSaving = input(false);
  readonly saveMessage = input<string | null>(null);
  readonly saveError = input<string | null>(null);
  readonly saveRequested = output<void>();
  readonly avatarError = output<Event>();
}
