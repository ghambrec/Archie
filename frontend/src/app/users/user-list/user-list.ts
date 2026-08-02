import { Component, inject, OnInit } from '@angular/core';
import { Users } from '../users';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
	selector: 'app-user-list',
	imports: [TranslocoPipe],
	templateUrl: './user-list.html',
	styleUrl: './user-list.scss',
})
export class UserList implements OnInit {
	protected readonly usersService = inject(Users);

	ngOnInit() {
		this.usersService.getUserList();
	}
}
