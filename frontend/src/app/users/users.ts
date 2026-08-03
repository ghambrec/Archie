import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface CreateUserRequest {
	email: string;
	password: string;
	displayName: string;
}

export interface CreateUserResponse {
	id: string;
	email: string;
	displayName: string;
}

export interface UsersList {
	id: string;
	email: string;
	displayName: string;
	preferredLanguage: string;
	lastLogin: string;
	isActive: boolean;
	avatar: string;
}

@Service()
export class Users {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/users`;

	readonly usersList = signal<UsersList[]>([]);

	create(body: CreateUserRequest) {
		const url = `${this.baseUrl}/create`;

		return this.http.post<CreateUserResponse>(url, body);
	}

	getUsersList() {
		// const url = `${this.baseUrl}/xxx`;

		// this.http.get<UserList[]>(url).subscribe((users) => {
		// 	this.userList.set(users);
		// });

		// dummy data, no endpoint here
		this.usersList.set(
			[
				{
					"id": "3d5cd382-5e0b-4066-840b-d496a7cd39as",
					"email": "user1@mail.de",
					"displayName": "Paul",
					"preferredLanguage": "en",
					"lastLogin": "2026-08-01 14:04:17",
					"isActive": true,
					"avatar": "https://api.dicebear.com/9.x/identicon/svg?seed=paul"
				},
				{
					"id": "3d54bb82-5e0b-4066-840b-d496a7cd30ce",
					"email": "user2@mail.de",
					"displayName": "Nikita",
					"preferredLanguage": "en",
					"lastLogin": "",
					"isActive": false,
					"avatar": "https://api.dicebear.com/9.x/identicon/svg?seed=nikita"
				},
				{
					"id": "3d54bb82-5e0b-4066-500b-d496a7cd30ce",
					"email": "user3@mail.de",
					"displayName": "Cedric",
					"preferredLanguage": "en",
					"lastLogin": "",
					"isActive": true,
					"avatar": "https://api.dicebear.com/9.x/identicon/svg?seed=cedric"
				}
			]
		)
	}

	addToUserList(user: UsersList) {
		this.usersList.update((currentList) => [...currentList, user]);
	}

}
