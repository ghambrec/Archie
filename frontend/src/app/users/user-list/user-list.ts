import { Component, inject, OnInit } from '@angular/core';
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

	ngOnInit() {
		this.usersService.getUserList();
	}

	openCreateUserModal() {
		this.modalService.open(CreateUserModal);
	}

	openEditUserModal() {
		this.modalService.open(EditUserModal);
	}
}
