import { Service, computed, inject, signal, type Signal } from '@angular/core';
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
}

export interface PatchUser {
	email?: string;
	displayName?: string;
	password?: string;
	preferredLanguage?: string;
}

export interface EditUserForm {
	email: string;
	displayName: string;
	password: string;
	preferredLanguage: SupportedLanguage;
}

export interface UpdateUserResponse {
	id: string; 
}

export interface UserInfo {
	id: string;
	email: string;
	displayName: string;
	preferredLanguage: SupportedLanguage;
	isActive: boolean;
	lastLoginAt: string | null;
  deletedAt?: string | null;
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
	hasToChangePassword: boolean;
}

@Service()
export class Users {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/users`;

	readonly currentUser = signal<CurrentUser | null>(null);
	readonly isAdminUser = computed(() => this.currentUser()?.isAdmin === true);
	readonly isLoggedIn = computed(() => !!this.currentUser() && !this.currentUser()!.hasToChangePassword);

	readonly users = httpResource<UserInfo[]>(
		() => this.isLoggedIn()
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

  // Frontend contract: the admin-only endpoint returns GetUsersResponse including deletedAt.
  deletedUsersResource(enabled: Signal<boolean>) {
    return httpResource<UserInfo[]>(
      () => enabled() && this.isLoggedIn()
        ? {
            url: `${this.baseUrl}/deleted`,
            params: { limit: 100 },
            withCredentials: true,
          }
        : undefined,
      {
        defaultValue: [],
        parse: (raw: unknown) => (raw as GetUsersResponse).data,
      },
    );
  }

  // The backend must revoke old sessions before reactivating the account.
  restoreUser(userId: string) {
    return this.http.patch<void>(`${this.baseUrl}/${userId}/restore`, {}, { withCredentials: true });
  }

	getCurrentUser() {
		const url = `${this.baseUrl}/me`;
		return this.http.get<CurrentUser>(url, { withCredentials: true });
	}

	create(body: CreateUserRequest) {
		const url = `${this.baseUrl}/create`;

		return this.http.post<CreateUserResponse>(url, body, { withCredentials: true });

	}

  deleteUser(userId: string) {
    return this.http.delete<void>(`${this.baseUrl}/${userId}`, { withCredentials: true });
  }

	getAvatarUrl(userId?: string | null) {
		if (!userId) {
			return '/avatar';
		}
		return `${this.baseUrl}/${userId}/avatar`;
	}

	update(userId: string, changes: PatchUser) {
		const url = `${this.baseUrl}/${userId}`;
		
		return this.http.patch<PatchUser>(url, changes, {withCredentials: true });
	}
}
