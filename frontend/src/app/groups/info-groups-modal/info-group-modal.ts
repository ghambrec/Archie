import { Component, inject, signal } from "@angular/core";
import { TranslocoPipe } from "@jsverse/transloco";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { GroupMember, GroupResponseAdmin, Groups } from "../groups";

@Component({
  selector: 'app-info-group-modal',
  imports: [TranslocoPipe],
  templateUrl: './info-group-modal.html',
  styleUrl: './info-group-modal.scss',
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

  closeModal(): void {
    this.activeModal.dismiss();
  }
}