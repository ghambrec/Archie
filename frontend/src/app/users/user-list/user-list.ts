import { Component, computed, inject, OnInit, signal} from '@angular/core';
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

	private loadUsers(): void {
		this.usersService.getUsersList().subscribe({
			next: (response) => {
				this.usersService.usersList.set(
					response.data,
				);
			},

			error: (error) => {
				console.error (
					'Unable to load users', error
				);
			}
		});
	}

	protected readonly filteredUserList = computed(() => {
		const searchStringLowercased = this.searchString().toLowerCase();
		return this.usersService.usersList().filter((user) => 
			user.displayName.toLowerCase().includes(searchStringLowercased) ||
			user.email.toLowerCase().includes(searchStringLowercased)
		)
	});
	ngOnInit(): void {
		this.loadUsers();
	}


	openCreateUserModal(): void{ 
		const modal = this.modalService.open(
			CreateUserModal, 
			{ centered: true},
		);

		modal.closed.subscribe(() => {
			this.loadUsers();
		});
	}

	openEditUserModal() {
		this.modalService.open(EditUserModal, 
			{ centered: true });
	}
}
