import { Service, computed, inject, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
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

	readonly users = httpResource<UserInfo[]>(
		() => this.currentUser()
		? {
			url: this.baseUrl,
			params: {limit: 100},
			withCredentials: true 
		}
		: undefined,
		{
			defaultValue: [],
			parse: (raw: unknown) => (raw as GetUsersResponse).data
		}
	)

	getCurrentUser() {
		const url = `${this.baseUrl}/me`;
		return this.http.get<CurrentUser>(url, { withCredentials: true });
	}

	create(body: CreateUserRequest) {
		const url = `${this.baseUrl}/create`;

		return this.http.post<CreateUserResponse>(url, body, { withCredentials: true });

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
