import { inject, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import type { SupportedLanguage } from '../core/i18n/supported-language'

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

export interface CurrentUser {
	id: string;
	email: string;
	displayName: string;
	preferredLanguage: SupportedLanguage; 
}



@Service()
export class Auth {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/auth`;

	readonly currentUser = signal<CurrentUser | null>(null);

	login(body: LoginRequest) {
		const url = `${this.baseUrl}/login`;

		return this.http.post<LoginResponse>(url, body, { withCredentials: true });
	}

	logout() {
		const url = `${this.baseUrl}/logout`;

		return this.http.get<void>(url, { withCredentials: true });
	}
	getCurrentUser(){
		const url = `${environment.apiUrl}/users/me`;

		return this.http.get<CurrentUser>(url, { withCredentials: true })
	}

	async checkSession(): Promise<boolean> {
		const url = `${this.baseUrl}/me`;

		try {
			const user = await firstValueFrom(this.http.get<CurrentUser>(url, { withCredentials: true }));
			this.currentUser.set(user);
			return true;
		} catch {
			this.currentUser.set(null);
			return false;
		}
	}
}
