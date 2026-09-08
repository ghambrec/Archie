import { Component, computed, inject, signal } from "@angular/core";
import { TranslocoPipe } from "@jsverse/transloco";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { GroupMember, GroupResponseAdmin, Groups } from "../groups";
import { Users } from "../../users/users";

@Component({
  selector: 'app-info-group-modal',
  imports: [TranslocoPipe],
  templateUrl: './group-info-modal.html',
  styleUrl: './group-info-modal.scss',
})
export class InfoGroupModal {
  selectedGroup!: GroupResponseAdmin // Define Assignment Assertion

  readonly members = signal<GroupMember[]>([]);
  
  readonly isLoading = signal(false);
  readonly hasLoadError = signal(false);

  protected readonly activeModal = inject(NgbActiveModal);
  private readonly groupsService = inject(Groups);

  loadMembers(): void {
    this.isLoading.set(true);
    this.hasLoadError.set(false);

    const request = this.groupsService.infoGroups(this.selectedGroup.id);
    
    request.subscribe({
      next: response => {
        this.members.set(response.members);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasLoadError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  ////

  private readonly userService = inject(Users);
  protected readonly searchString = signal("");

  readonly actionError = signal<string | null>(null);
  readonly feedbackMsg = signal<string | null>(null);

  protected readonly filteredUserList = computed(() => {
    const  search = this.searchString().trim().toLowerCase();

    if (!search) {
      return [];
    }

    return this.userService.usersList().filter(user =>
      !this.members().some(member =>
        member.userId === user.id) &&
      user.displayName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  });

  addUserToGroup(userId: string): void {
    this.actionError.set(null);
    this.feedbackMsg.set(null);
    
    const request = this.groupsService.addUserToGroup(this.selectedGroup.id, userId);

    request.subscribe({
      next: () => {
        this.feedbackMsg.set("groups.infoGroup.userAdded");
        this.searchString.set("");
        this.loadMembers();
      },
      error: error => {
        let translocoKey = "groups.infoGroup.errorAddingUser";

        if (error.status === 409) {
          translocoKey = "groups.infoGroup.userAlreadyMember";
        }

        this.actionError.set(translocoKey);
      },
    });
  }

  loadUsers(): void {
    const request = this.userService.getUsersList(1, 100);
    
    request.subscribe({
      next: response => {
        this.userService.usersList.set(response.data);
      },
      error: () => {
        this.actionError.set("groups.infoGroup.errorLoadingUsers");
      },
    });
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }
}