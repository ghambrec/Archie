import { Component, inject, signal} from '@angular/core';
import { FormField,FormRoot } from '@angular/forms/signals';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SupportedLanguage } from '../../core/i18n/supported-language';
import { PatchUser, Users, UserInfo, EditUserForm } from '../users';
import { UserInfoModal } from '../user-info-modal/user-info-modal';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-edit-user-modal',
  imports: [FormRoot, FormField, TranslocoPipe],
  templateUrl: './edit-user-modal.html',
  styleUrl: './edit-user-modal.scss',
})
export class EditUserModal {
  selectedUser!: UserInfo;

  protected readonly activeModal = inject(NgbActiveModal);

  editUserModal = signal<EditUserForm>({
    email: '',
	  displayName: '',
	  preferredLanguage: 'en',
    password: '',
  })
  initialize(user: UserInfo): void {
    this.selectedUser = user;

    this.editUserModal.set({
      email: user.email,
      displayName: user.displayName,
      preferredLanguage: user.preferredLanguage,
      password: '',

    });
  };
  save(): void {

  try {

    const values = this.editUserModal();

    const changes: PatchUser = {
      email: values.email,
      displayName: values.displayName,
      preferredLanguage: values.preferredLanguage,
    }; 

    if (values.password !==' ' ) 
    {
      changes.password = values.password;
    }

    //update(userId: string, changes: PatchUser) {
    //  const url =`${this.baseUrl}/UserID`;

    //  return this.http.patch<UserInfo> (
    //    url,
    //    changes, 
    //    { withCredentials: true },
    //)
    //};


  } catch (error : any) {
    let tranlocoKey = error.status == 409;
  }
  }

}
