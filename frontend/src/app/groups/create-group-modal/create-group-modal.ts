import { Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Groups } from '../groups';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { firstValueFrom, timer } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
	selector: 'app-create-group-modal',
	imports: [FormRoot, FormField, TranslocoPipe],
	templateUrl: './create-group-modal.html',
	styleUrl: './create-group-modal.scss',
})
export class CreateGroupModal {
	protected readonly activeModal = inject(NgbActiveModal);
	private readonly groupsService = inject(Groups);

	readonly feedbackMsg = signal<string | null>(null);

	createGroupModal = signal({
		name: '',
		description: '',
	});

	createGroupAdminForm = form(
		this.createGroupModal,
		(p) => {
			required(p.name, { message: 'name is mandatory' });
		},
		{
			submission: {
				action: async (field) => {
					this.feedbackMsg.set(null);
					try {
						const formValues = field().value();
						
						const input = {
							name: formValues.name,
							description: formValues.description?.trim() ? formValues.description.trim() : null,
						};
						
						const response = await firstValueFrom(this.groupsService.createGroupAdmin(input));

						this.feedbackMsg.set('groups.createGroupAdmin.feedbackMsg');
						await firstValueFrom(timer(500));
						this.activeModal.close();
						return;
					} catch (error : any) {
						let translocoKey = error.status == 409
							? "groups.createGroupAdmin.errorConflict"
							: "groups.createGroupAdmin.errorGeneral";

						if (translocoKey == "groups.createGroupAdmin.errorConflict" 
							&& error.error?.message.toLowerCase().includes("name")) {
							translocoKey = "groups.createGroupAdmin.errorConflictName"
						} else {
							translocoKey = "groups.createGroupAdmin.errorGeneral";
						}
						return { kind: 'serverError', message: translocoKey };
					}
				}
			}
		}
	)
}
