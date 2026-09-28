import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../environments/environment';

export interface UploadResponse {
	id: string;
	objectKey: string;
}

@Service()
export class Documents {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/documents`;

	upload(file: File) {
		const url = `${this.baseUrl}/upload`;

		const formData = new FormData();
		formData.append('file', file);

		return this.http.post<UploadResponse>(url, formData, {
			withCredentials: true,
			observe: 'events',
			reportProgress: true
		});
	}

	// TODO: set group wird abgeloest sobald POST upload korrigiert wurde und gruppe pflicht ist
	setGroup(documentId: string, groupId: string) {
		return this.http.post<void>(`${this.baseUrl}/${documentId}/group`, { groupId }, {
			withCredentials: true
		});
	}
}
