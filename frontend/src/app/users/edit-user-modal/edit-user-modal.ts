import { Component, inject, signal} from '@angular/core';
import { form, FormField,FormRoot } from '@angular/forms/signals';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SupportedLanguage } from '../../core/i18n/supported-language';
import { PatchUser, Users, UserInfo, EditUserForm } from '../users';
import { UserInfoModal } from '../user-info-modal/user-info-modal';
import { environment } from '../../../environments/environment';
import { PrefixNot } from '@angular/compiler';
import { firstValueFrom } from 'rxjs';


type EditUserFormInput = Omit<EditUserForm, 'preferredLanguage'> & {
  preferredLanguage: string;
};

@Component({
  selector: 'app-edit-user-modal',
  imports: [FormRoot, FormField, TranslocoPipe],
  templateUrl: './edit-user-modal.html',
  styleUrl: './edit-user-modal.scss',
})
export class EditUserModal {
  selectedUser!: UserInfo;

  protected readonly activeModal = inject(NgbActiveModal);

  protected readonly user = inject(Users)

  editUserModal = signal<EditUserFormInput>({
    email: '',
	  displayName: '',
	  preferredLanguage: 'en',
    password: '',
  })

  editUserForm = form(this.editUserModal)

  initialize(user: UserInfo): void {
    this.selectedUser = user;

    this.editUserModal.set({
      email: user.email,
      displayName: user.displayName,
      preferredLanguage: user.preferredLanguage,
      password: '',

    });
  };


  async save(): Promise <void> {

    const values = this.editUserModal();
    const language = values.preferredLanguage.trim().toLowerCase(); 
    
    if((language !== 'en') && (language !== 'de') && (language !== 'es'))
      throw new Error ("Unspported language")
    const changes: PatchUser = {
      email: values.email.trim(),
      displayName: values.displayName.trim(),
      preferredLanguage: language,
    }; 
    if (values.password.trim() !== '' ) 
    {
      changes.password = values.password;
    }
    try {
      await firstValueFrom ( 
        this.user.update(this.selectedUser.id, changes)
      )
    
    this.activeModal.close();
    } catch (error : any) {
      let tranlocoKey = error.status == 409;
    }
    }

}
