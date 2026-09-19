import { Component, inject, signal } from "@angular/core";
import { TranslocoPipe } from "@jsverse/transloco";
import { UserGroupsResponse, UserInfo, Users } from "../users";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-user-info-modal',
  imports: [TranslocoPipe],
  templateUrl: './user-info-modal.html',
  styleUrl: './user-info-modal.scss',
})
export class UserInfoModal {
  selectedUser!: UserInfo;
  
  readonly userGroups = signal<UserGroupsResponse | null>(null);
  readonly isLoading = signal(false);
  readonly hasLoadError = signal(false);

  protected readonly activeModal = inject(NgbActiveModal);
  private readonly usersService = inject(Users);

  loadUserGroups(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);

    const request = this.usersService.getGroupsByUserId(this.selectedUser.id);

    request.subscribe({
      next: response => {
        this.userGroups.set(response);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasLoadError.set(true);
        this.isLoading.set(false);
      },
    });
  }


  closeModal(): void {
    this.activeModal.dismiss();
  }
}