import { Service, inject, signal } from '@angular/core';
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

export interface UserInfo {
		id: 	string;
		email:	string;
		displayName: string;
		preferredLanguage: string;
		isActive: boolean;
		lastLoginAt: string | null;
		//avatar: string;

	}

export interface GetUsersResponse{
	data: UserInfo[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;

}

//export interface UsersList {
//	id: string;
//	email: string;
//	displayName: string;
//	preferredLanguage: string;
//	lastLogin: string;
//	isActive: boolean;
//	avatar: string;
//}

@Service()
export class Users {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/users`;


	readonly usersList = signal<UserInfo[]>([]);
	

	create(body: CreateUserRequest) {
		const url = `${this.baseUrl}/create`;

		return this.http.post<CreateUserResponse>(url, body);

	}
	//this.usersList.set();

	getUsersList(page =1, limit = 20){
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
	//addToUserlist(user: UserInfo){
	//	this.usersList.update((currentList)) =>
	//		const newList = [...currentList]
	//		newList.push(user);
	//		return newList
	//} 

}
