import { Component, inject, signal} from '@angular/core';
import { FormField,FormRoot } from '@angular/forms/signals';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SupportedLanguage } from '../../core/i18n/supported-language';
import { PatchUser, Users, UserInfo } from '../users';
import { UserInfoModal } from '../user-info-modal/user-info-modal';

@Component({
  selector: 'app-edit-user-modal',
  imports: [FormRoot, FormField, TranslocoPipe],
  templateUrl: './edit-user-modal.html',
  styleUrl: './edit-user-modal.scss',
})
export class EditUserModal {
  selectedUser!: UserInfo;

  protected readonly activeModal = inject(NgbActiveModal);

  editUserModal = signal({
    email: '',
	  displayName: '',
	  preferredLanguage: '',
    password: '',
  })
  initialize(user: UserInfo): void {
    this.selectedUser = user;

    this.editUserModal.set({
      email: user.email,
      displayName: user.displayName,
      preferredLanguage: user.preferredLanguage,
      password: '',

    })
  }
}
