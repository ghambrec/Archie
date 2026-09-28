import { Service, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SupportedLanguage } from '../core/i18n/supported-language';

export interface UserGroupMembership {
	groupId: string;
	name: string;
	joinedAt: string;
}

export interface UserGroupsResponse {
	userId: string;
	displayName: string;
	email: string;
	groups: UserGroupMembership[];
}

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

export interface UserInfo {
	id: string;
	email: string;
	displayName: string;
	preferredLanguage: string;
	isActive: boolean;
	lastLoginAt: string | null;
	//avatar: string;

}

export interface GetUsersResponse {
	data: UserInfo[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;

}

export interface CurrentUser {
	id: string;
	email: string;
	displayName: string;
	preferredLanguage: SupportedLanguage;
	isAdmin: boolean;
}

@Service()
export class Users {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/users`;

	readonly currentUser = signal<CurrentUser | null>(null);
	readonly isAdminUser = computed(() => this.currentUser()?.isAdmin === true);

	readonly usersList = signal<UserInfo[]>([]);


	getCurrentUser() {
		const url = `${this.baseUrl}/me`;
		return this.http.get<CurrentUser>(url, { withCredentials: true });
	}

	create(body: CreateUserRequest) {
		const url = `${this.baseUrl}/create`;

		return this.http.post<CreateUserResponse>(url, body, { withCredentials: true });

	}

	getUsersList(page = 1, limit = 20) {
		return this.http.get<GetUsersResponse>(
			this.baseUrl,
			{
				params: {
					page: page.toString(),
					limit: limit.toString(),
				},
				withCredentials: true,
			}
		)
	}

	getGroupsByUserId(userId: string) {
		return this.http.get<UserGroupsResponse>(
			`${environment.apiUrl}/user-groups/userId/${userId}/groups`,
			{
				withCredentials: true,
			},
		);
	}

	getAvatarUrl(userId?: string | null) {
		if (!userId) {
			return '/avatar';
		}
		return `${this.baseUrl}/${userId}/avatar`;
	}
}
