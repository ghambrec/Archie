import { Service, inject } from '@angular/core';
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

@Service()
export class Users {
	private readonly http = inject(HttpClient);

	create(body: CreateUserRequest) {
		const url = `${environment.apiUrl}/users/create`;

		return this.http.post<CreateUserResponse>(url, body);
	}
}
