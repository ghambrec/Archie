import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	id: string;
	email: string;
	displayName: string;
}

@Service()
export class Auth {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/auth`;

	login(body: LoginRequest) {
		const url = `${this.baseUrl}/login`;

		return this.http.post<LoginResponse>(url, body, { withCredentials: true });
	}
}
