import { Component, inject, signal } from "@angular/core";
import { form, FormField, FormRoot, required } from "@angular/forms/signals";
import { TranslocoPipe } from "@jsverse/transloco";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { GroupResponseAdmin, Groups, UpdateGroupDto } from "../groups";
import { first, firstValueFrom, timer } from "rxjs";

@Component({
  selector: 'app-edit-group-modal',
	imports: [FormRoot, FormField, TranslocoPipe],
	templateUrl: './edit-group-modal.html',
	styleUrl: './edit-group-modal.scss',
})
export class EditGroupModal {
  selectedGroup!: GroupResponseAdmin;

  protected readonly activeModal = inject(NgbActiveModal);
  private readonly groupsService = inject(Groups);

  readonly feedbackMsg = signal<string | null>(null);

  editGroupModal = signal({
    name: '',
    description: '',
  });

  editGroupAdminForm = form(
    this.editGroupModal,
    (p) => {},
    {
      submission: {
        action: async (field) => {
          this.feedbackMsg.set(null);
          try {
            const formValues = field().value();

            const input: UpdateGroupDto = {};

            if (formValues.name.trim() !== '') {
              input.name = formValues.name.trim();
            }

            if (formValues.description.trim() !== '') {
              input.description = formValues.description.trim();
            }

            if (Object.keys(input).length === 0) {
              this.activeModal.close();
              return;
            }

            await firstValueFrom(this.groupsService.editGroupAdmin(this.selectedGroup.id, input));

            this.feedbackMsg.set('groups.editGroupAdmin.feedbackMsg');
            await firstValueFrom(timer(500));
            this.activeModal.close();
            return;
          } catch (error : any) {
            let translocoKey = error.status === 409
              ? 'groups.editGroupAdmin.errorConflictName'
              : 'groups.editGroupAdmin.errorGeneral';

            return {
              kind: 'serverError',
              message: translocoKey,
            };
          }
        }
      }
    }
  )
}