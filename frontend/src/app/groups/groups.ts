import { Service, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface GroupResponseAdmin {
	id: string;
	name: string;
	description: string | null;
	isSystem: boolean;
}

export interface CreateGroupDto {
	name: string;
	description?: string | null;
}

@Service()
export class Groups {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/admin/groups`;
	
	readonly groupsList = signal<GroupResponseAdmin[]>([]);
	
	getGroupsAdmin() {
		return this.http.get<GroupResponseAdmin[]>(
			this.baseUrl,
			{
				withCredentials: true,
			}
		);
	}

	createGroupAdmin(dto: CreateGroupDto) {
		return this.http.post<GroupResponseAdmin>(`${this.baseUrl}/create`,
			dto,
			{
				withCredentials: true
			}
		);
	}

	// deleteGroupAdmin() {
	// 	return this.http.
	// }
}
