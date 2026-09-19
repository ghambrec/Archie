import { Component, inject, signal } from "@angular/core";
import { TranslocoPipe } from "@jsverse/transloco";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { GroupResponse, Groups } from "../groups";

@Component({
  selector: 'app-delete-group-modal',
	imports: [TranslocoPipe],
	templateUrl: './delete-group-modal.html',
	styleUrl: './delete-group-modal.scss',
})
export class DeleteGroupModal {
  selectedGroup!: GroupResponse;

  protected readonly activeModal = inject(NgbActiveModal);
  private readonly groupsService = inject(Groups);

  readonly errorMsg = signal<string | null>(null);

  confirmDelete(): void {
    this.groupsService.deleteGroup(this.selectedGroup.id).subscribe({
      next: () => {
        this.activeModal.close();
      },
      error: (error) => {
        let translocoKey = 'groups.deleteGroupAdmin.errorGeneral';

        if (error.status === 403) {
          translocoKey = 'groups.deleteGroupAdmin.errorForbidden';
        } else if (error.status === 404) {
          translocoKey = 'groups.deleteGroupAdmin.errorNotFound';
        } else if (error.status === 409) {
          translocoKey = 'groups.deleteGroupAdmin.errorHasDocuments'
        }

        this.errorMsg.set(translocoKey);
      },
    });
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }
}