import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Users } from '../users';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateUserModal } from '../create-user-modal/create-user-modal';
import { EditUserModal } from '../edit-user-modal/edit-user-modal';

@Component({
	selector: 'app-user-list',
	imports: [TranslocoPipe],
	templateUrl: './user-list.html',
	styleUrl: './user-list.scss',
})
export class UserList implements OnInit {
	protected readonly usersService = inject(Users);
	private readonly modalService = inject(NgbModal);

	protected readonly searchString = signal("");

	protected readonly filteredUserList = computed(() => {
		const searchStringLowercased = this.searchString().toLowerCase();
		return this.usersService.usersList().filter((user) => 
			user.displayName.toLowerCase().includes(searchStringLowercased) ||
			user.email.toLowerCase().includes(searchStringLowercased)
		)
	});

	ngOnInit() {
		this.usersService.getUsersList();
	}

	openCreateUserModal() {
		const ret = this.modalService.open(CreateUserModal, { centered: true });
		ret.closed.subscribe((createdUser) => {
			this.usersService.addToUserList(createdUser);
		});
	}

	openEditUserModal() {
		this.modalService.open(EditUserModal, { centered: true });
	}
}
