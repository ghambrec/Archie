import { Component, inject, signal} from '@angular/core';
import { minLength, form, FormField,FormRoot, maxLength, pattern, email } from '@angular/forms/signals';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SupportedLanguage } from '../../core/i18n/supported-language';
import { PatchUser, Users, UserInfo, EditUserForm } from '../users';
import { UserInfoModal } from '../user-info-modal/user-info-modal';
import { environment } from '../../../environments/environment';
import { PrefixNot } from '@angular/compiler';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';


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
  readonly saveErrorKey = signal<string | null>(null);
  protected readonly activeModal = inject(NgbActiveModal);

  protected readonly user = inject(Users)

  editUserModal = signal<EditUserFormInput>({
    email: '',
	  displayName: '',
	  preferredLanguage: 'en',
    password: '',
  })

  editUserForm = form(this.editUserModal, (schemaPath) =>{
    minLength(schemaPath.password, 8), {  message: 'users.updateuser.errors.passwordError'}
    maxLength(schemaPath.password, 25), { message: 'users.updateuser.errors.passwordError'}

    email(schemaPath.email),   {message: 'users.updateUser.errors.emailFormat'}
    pattern(schemaPath.password,  /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).*$/,), {
       message: 'users.updateUser.errors.passwordPattern'
    }
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


  async save(): Promise <void> {
    this.saveErrorKey.set(null);

    const values = this.editUserModal();
  
    const changes: PatchUser = {}

    const newEmail =  values.email.trim().toLowerCase();
    const origEmail = this.selectedUser.email.trim().toLocaleLowerCase();
    if (newEmail !== origEmail)
      changes.email = newEmail;

    const newDisplayName =  values.displayName.trim();
    const origDisplayName = this.selectedUser.displayName.trim();
    if (newDisplayName !== origDisplayName)
      changes.displayName = newDisplayName;

    const newLanguage = values.preferredLanguage.trim().toLowerCase(); 
    const origLanguage = this.selectedUser.preferredLanguage;
    if((newLanguage !== 'en') && (newLanguage !== 'de') && (newLanguage !== 'es'))
      throw new Error ("UNSUPPORTED_LANGUAGE")
    if ( newLanguage !== origLanguage)
        changes.preferredLanguage = newLanguage
      
    if (values.password.trim() !== '' ) 
    {
  
      changes.password = values.password;
    }

    try {
      await firstValueFrom ( 
        this.user.update(this.selectedUser.id, changes)
      )
    
    this.activeModal.close();
    } catch (error : unknown) {
      let code: string | undefined; // why let and not const 
      if (error instanceof HttpErrorResponse) 
      {
        code = error.error?.code;
      }else {
        code = undefined;

      }

      switch (code) {
        case 'AUTH_EMAIL_ALREADY_REGISTERED':
        case 'USER_NAME_ALREADY_REGISTERED':
        case 'VALIDATION_FAILED':
        case 'INTERNAL_SERVER_ERROR':
        case 'UNSUPPORTED_LANGUAGE':
          this.saveErrorKey.set(`errors.${code}`);
          break;
  
        default:
          this.saveErrorKey.set('error.UNKOWN');
      }
      this.editUserForm.password().markAsTouched();
      if (this.editUserForm().invalid()) {
        return 
      }
    }

    }

}
