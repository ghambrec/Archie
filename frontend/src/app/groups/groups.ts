import { Service, signal, inject } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface GroupResponse {
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

export interface UserPermission {
	userId: string;
	permKey: string;
}

@Service()
export class Groups {
	private readonly http = inject(HttpClient);
	private readonly groupsUrl = `${environment.apiUrl}/groups`;
	private readonly userGroupsUrl = `${environment.apiUrl}/user-groups`;
	private readonly userPermissionsUrl = `${environment.apiUrl}/user-permission`;

	readonly groups = httpResource<GroupResponse[]>(
		() => ({ url: this.groupsUrl, withCredentials: true}),
		{ defaultValue: [] }
	);

	createGroup(dto: CreateGroupDto) {
		return this.http.post<GroupResponse>(`${this.groupsUrl}/create`,
			dto,
			{
				withCredentials: true
			}
		);
	}

	deleteGroup(id: string) {
		return this.http.delete<void>(`${this.groupsUrl}/${id}`,
			{
				withCredentials: true,
			}
		);
	}

	editGroup(id: string, dto: UpdateGroupDto) {
		return this.http.patch<void>(`${this.groupsUrl}/${id}`,
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
			{
				userId
			},
			{
				withCredentials: true,
			},
		);
	}

	removeUserFromGroup(groupId: string, userId: string) {
		return this.http.delete(`${this.userGroupsUrl}/groups/${groupId}/members/${userId}`,
			{
				withCredentials: true
			},
		);
	}

	getGroupPermissions(groupId: string) {
		return this.http.get<UserPermission[]>(`${this.userPermissionsUrl}/${groupId}/permissions`,
			{
				withCredentials: true,
			},
		);
	}

	addUserPermission(groupId: string, userId: string, permKey: string) {
		return this.http.post(
			`${this.userPermissionsUrl}/${groupId}/permissions`,
			{
				userId,
				permKey
			},
			{ 
				withCredentials: true
			},
		);
	}

	removeUserPermissions(groupId: string, userId: string, permKey: string) {
		return this.http.delete(
			`${this.userPermissionsUrl}/${groupId}/permissions/${userId}/${encodeURIComponent(permKey)}`,
			{
				withCredentials: true
			},
		);
	}
}
