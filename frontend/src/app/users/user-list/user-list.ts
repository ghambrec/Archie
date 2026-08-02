import { Component, inject, OnInit } from '@angular/core';
import { Users } from '../users';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateUserForm } from '../create-user-form/create-user-form';

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
		this.modalService.open(CreateUserForm);
	}
}
