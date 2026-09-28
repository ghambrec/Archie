import { inject, Service, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import type { SupportedLanguage } from '../core/i18n/supported-language'
import { Users } from '../users/users';

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	id: string;
	email: string;
	displayName: string;
	preferredLanguage: SupportedLanguage;
}


@Service()
export class Auth {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/auth`;
	private readonly usersService = inject(Users)


	login(body: LoginRequest) {
		const url = `${this.baseUrl}/login`;

		return this.http.post<LoginResponse>(url, body, { withCredentials: true });
	}

	logout() {
		const url = `${this.baseUrl}/logout`;

		return this.http.get<void>(url, { withCredentials: true });
	}

	async checkSession(): Promise<boolean> {
		try {
			const user = await firstValueFrom(this.usersService.getCurrentUser());
			this.usersService.currentUser.set(user);
			return true;
		} catch {
			this.usersService.currentUser.set(null);
			return false;
		}
	}
}
