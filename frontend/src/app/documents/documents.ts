import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../environments/environment';

export interface UploadConfig {
	maxSizeBytes: number;
	allowedExtensions: string[]; // mit .
	aiSupportedExtensions: string[];
}

export interface UploadResponse {
	id: string;
	objectKey: string;
}

@Service()
export class Documents {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/documents`;

	readonly uploadConfig = httpResource<UploadConfig>(
		() => ({ url: `${this.baseUrl}/upload-config`, withCredentials: true })
	);

	upload(file: File, groupId: string) {
		const url = `${this.baseUrl}/upload/${groupId}`;

		const formData = new FormData();
		formData.append('file', file);

		return this.http.post<UploadResponse>(url, formData, {
			withCredentials: true,
			observe: 'events',
			reportUploadProgress: true
		});
	}

	// drin lassen, vielleicht noch mal benoetigt?
	// setGroup(documentId: string, groupId: string) {
	// 	return this.http.post<void>(`${this.baseUrl}/${documentId}/group`, { groupId }, {
	// 		withCredentials: true
	// 	});
	// }
}
