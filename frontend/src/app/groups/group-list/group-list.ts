import { TranslocoPipe } from '@jsverse/transloco';
import { GroupMember, GroupResponse, Groups } from '../groups';
import { computed, inject, Component, signal } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateGroupModal } from '../create-group-modal/create-group-modal';
import { DeleteGroupModal } from '../delete-group-modal/delete-group-modal';
import { EditGroupModal } from '../edit-group-modal/edit-group-modal';
import { InfoGroupModal } from '../group-info-modal/group-info-modal';


@Component({
	selector: 'app-group-list',
	imports: [TranslocoPipe],
	templateUrl: './group-list.html',
	styleUrl: './group-list.scss',
})
export class GroupList {

	protected readonly groupsService = inject(Groups);
	protected readonly searchString = signal("");
	protected readonly modalService = inject(NgbModal);

	protected readonly hasLoadError = computed(() => !!this.groupsService.groups.error());

	protected readonly filteredGroupList = computed(() => {
		const searchStringGroups = this.searchString().trim().toLowerCase();
		const groups = this.groupsService.groups.value();

		if (!searchStringGroups) {
			return groups;
		}

		return groups.filter((group) => group.name.trim().toLowerCase().includes(searchStringGroups));
	});

	openCreateGroupModal(): void {
		const modal = this.modalService.open(CreateGroupModal, { centered: true });
		modal.closed.subscribe(() => this.groupsService.groups.reload());
	};

	openDeleteGroupModal(group: GroupResponse): void {
		const modal = this.modalService.open(DeleteGroupModal, { centered: true });
		modal.componentInstance.selectedGroup = group;
		modal.closed.subscribe(() => this.groupsService.groups.reload());
	};

	openEditGroupModal(group: GroupResponse): void {
		const modal = this.modalService.open(EditGroupModal, { centered: true });
		modal.componentInstance.initialize(group);
		modal.closed.subscribe(() => this.groupsService.groups.reload());
	};

	openInforGroupModal(group: GroupResponse): void {
		const modal = this.modalService.open(
			InfoGroupModal,
			{
				centered: true,
				size: 'lg',
			}
		);
		modal.componentInstance.selectedGroup.set(group);
		modal.componentInstance.loadPermissions();
	}
}
