import { Component, inject, signal } from "@angular/core";
import { FormField, FormRoot } from "@angular/forms/signals";
import { TranslocoPipe } from "@jsverse/transloco";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { GroupResponseAdmin, Groups } from "../groups";

@Component({
  selector: 'app-delete-group-modal',
	imports: [TranslocoPipe],
	templateUrl: './delete-group-modal.html',
	styleUrl: './delete-group-modal.scss',
})
export class DeleteGroupModal {
  selectedGroup!: GroupResponseAdmin;

  protected readonly activeModal = inject(NgbActiveModal);
  private readonly groupsService = inject(Groups);

  readonly errorMsg = signal<string | null>(null);

  confirmDelete(): void {
    this.groupsService.deleteGroupAdmin(this.selectedGroup.id).subscribe({
      next: () => {
        this.activeModal.close();
      },
      error: (error) => {
        let translocoKey = 'groups.deleteGroup.errorGeneral';

        if (error.status === 403) {
          translocoKey = 'groups.deleteGroup.errorForbidden';
        } else if (error.status === 404) {
          translocoKey = 'groups.deleteGroup.errorNotFound';
        }

        this.errorMsg.set(translocoKey);
      },
    });
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }
}