import { Component, computed, inject, OnInit, signal} from '@angular/core';
import { UserInfo, Users } from '../users';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateUserModal } from '../create-user-modal/create-user-modal';
import { EditUserModal } from '../edit-user-modal/edit-user-modal';
import { UserInfoModal } from '../user-info-modal/user-info-modal';
import { Groups } from '../../groups/groups';

@Component({
	selector: 'app-user-list',
	imports: [TranslocoPipe],
	templateUrl: './user-list.html',
	styleUrl: './user-list.scss',
})
export class UserList {
	protected readonly usersService = inject(Users);
	private readonly modalService = inject(NgbModal);
	private readonly groupsService = inject(Groups);

	protected readonly searchString = signal("");

	protected readonly filteredUserList = computed(() => {
		const searchStringLowercased = this.searchString().toLowerCase();
		return this.usersService.users.value().filter((user) => 
			user.displayName.toLowerCase().includes(searchStringLowercased) ||
			user.email.toLowerCase().includes(searchStringLowercased)
		)
	});

	openCreateUserModal(): void{ 
		const modal = this.modalService.open(
			CreateUserModal, 
			{ centered: true},
		);

		modal.closed.subscribe(() => {
			this.usersService.users.reload();
			this.groupsService.groups.reload();
		});
	}

	openEditUserModal() {
		this.modalService.open(EditUserModal, 
			{ centered: true });
	}

	openUserInfoModal(user: UserInfo): void {
		const modal = this.modalService.open(
			UserInfoModal,
			{
				centered: true,
				size: 'lg',
			});
		modal.componentInstance.selectedUser = user;
		modal.componentInstance.loadUserGroups();
	}
}
