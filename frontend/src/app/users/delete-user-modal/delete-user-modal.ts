import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { Users, type UserInfo } from '../users';

@Component({
  selector: 'app-delete-user-modal',
  imports: [TranslocoPipe],
  templateUrl: './delete-user-modal.html',
})
export class DeleteUserModal {
  selectedUser!: UserInfo;
  protected readonly activeModal = inject(NgbActiveModal);
  private readonly usersService = inject(Users);
  readonly isDeleting = signal(false);
  readonly errorKey = signal<string | null>(null);

  async confirmDelete(): Promise<void> {
    if (this.isDeleting()) return;
    this.isDeleting.set(true);
    this.errorKey.set(null);
    try {
      await firstValueFrom(this.usersService.deleteUser(this.selectedUser.id));
      this.activeModal.close(this.selectedUser.id);
    } catch (error: unknown) {
      let key = 'users.deleteUser.errors.general';
      if (error instanceof HttpErrorResponse) {
        if (error.status === 403) {
          key = this.selectedUser.id === this.usersService.currentUser()?.id
            ? 'users.deleteUser.errors.selfDelete'
            : 'users.deleteUser.errors.forbidden';
        } else if (error.status === 404) {
          key = 'users.deleteUser.errors.notFound';
        } else if (error.status === 409) {
          key = 'users.deleteUser.errors.conflict';
        }
      }
      this.errorKey.set(key);
    } finally {
      this.isDeleting.set(false);
    }
  }
}
