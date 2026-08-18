import { Service, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';



export interface GroupInfo {
	id: string;
	name: string;
	description: string | null;
}

@Service()
export class Groups {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/groups`;
	
	readonly groupsList = signal<GroupInfo[]>([]);
	
	getGroups() {
		return this.http.get<GroupInfo[]>(
			this.baseUrl,
			{
				withCredentials: true,
			}
		);
	}
}


