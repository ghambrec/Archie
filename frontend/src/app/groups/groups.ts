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

export interface UpdateGroupDto {
	name?: string;
	description?: string | null;
}

export interface GroupMember {
	userId: string;
	displayName: string;
	joinedAt: string;
	email: string;
}

export interface GroupMembersResponse {
	groupId: string;
	groupName: string;
	members: GroupMember[];
}

@Service()
export class Groups {
	private readonly http = inject(HttpClient);
	private readonly adminGroupsUrl = `${environment.apiUrl}/admin/groups`;
	private readonly userGroupsUrl = `${environment.apiUrl}/user-groups`;
	
	readonly groupsList = signal<GroupResponseAdmin[]>([]);
	
	getGroupsAdmin() {
		return this.http.get<GroupResponseAdmin[]>(
			this.adminGroupsUrl,
			{
				withCredentials: true,
			}
		);
	}

	createGroupAdmin(dto: CreateGroupDto) {
		return this.http.post<GroupResponseAdmin>(`${this.adminGroupsUrl}/create`,
			dto,
			{
				withCredentials: true
			}
		);
	}

	deleteGroupAdmin(id: string) {
		return this.http.delete<void>(`${this.adminGroupsUrl}/${id}`,
			{
				withCredentials: true,
			}
		);
	}

	editGroupAdmin(id: string, dto: UpdateGroupDto) {
		return this.http.patch<void>(`${this.adminGroupsUrl}/${id}`,
			dto,
			{
				withCredentials: true,
			}
		);
	}

	infoGroups(id: string) {
		return this.http.get<GroupMembersResponse>(`${this.userGroupsUrl}/groups/${id}/members`,
			{
				withCredentials: true,
			},
		);
	}

	addUserToGroup(groupId: string, userId: string) {
		return this.http.post(`${this.userGroupsUrl}/groups/${groupId}/members`,
			{ userId },
			{
				withCredentials: true,
			},
		);
	}

}
