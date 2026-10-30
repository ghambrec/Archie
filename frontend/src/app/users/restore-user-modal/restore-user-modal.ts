import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { Users, type UserInfo } from '../users';

@Component({
  selector: 'app-restore-user-modal',
  imports: [TranslocoPipe],
  templateUrl: './restore-user-modal.html',
})
export class RestoreUserModal {
  selectedUser!: UserInfo;
  protected readonly activeModal = inject(NgbActiveModal);
  private readonly usersService = inject(Users);
  readonly isRestoring = signal(false);
  readonly errorKey = signal<string | null>(null);

  async confirmRestore(): Promise<void> {
    if (this.isRestoring()) return;
    this.isRestoring.set(true);
    this.errorKey.set(null);
    try {
      await firstValueFrom(this.usersService.restoreUser(this.selectedUser.id));
      this.activeModal.close(this.selectedUser.id);
    } catch (error: unknown) {
      let key = 'users.restoreUser.errors.general';
      if (error instanceof HttpErrorResponse) {
        if (error.status === 403) key = 'users.restoreUser.errors.forbidden';
        else if (error.status === 404) key = 'users.restoreUser.errors.notFound';
        else if (error.status === 409) key = 'users.restoreUser.errors.conflict';
      }
      this.errorKey.set(key);
    } finally {
      this.isRestoring.set(false);
    }
  }
}
