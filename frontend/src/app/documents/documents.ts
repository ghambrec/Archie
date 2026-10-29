import { HttpClient, httpResource } from '@angular/common/http';
import { inject, linkedSignal, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { AiStatus } from './documents-review';
import { Tag, Tags } from '../tags/tags';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

export interface UploadConfig {
	maxSizeBytes: number;
	allowedExtensions: string[]; // mit .
	aiSupportedExtensions: string[];
}

export interface UploadResponse {
	id: string;
	objectKey: string;
}

export interface DocumentSummary {
	id: string;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	createdAt: string;
	updatedAt: string;
	uploadedBy: { id: string; name: string };
	groups: { id: string; name: string }[];
	tags: Pick<Tag, 'id' | 'name' | 'label'>[];
	aiStatus: AiStatus;
	aiSummary?: string;
	language: string;
	aiErrorKey?: string | null;
	previewable: boolean;
}

export interface DocumentsPage {
	data: DocumentSummary[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

const PAGE_SIZE = 20;
const EMPTY_PAGE: DocumentsPage = { data: [], page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };

@Service()
export class Documents {
	private readonly http = inject(HttpClient);
	private readonly tags = inject(Tags);
	private readonly router = inject(Router);
	private readonly route = inject(ActivatedRoute);
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

	// current doc page, bei wechsel zurueck auf 1
	readonly page = linkedSignal({
		source: this.tags.selectedTagId,
		computation: () => 1
	});

	// doc liste laedt neu sobald sich tag oder page aendert
	readonly list = httpResource<DocumentsPage>(() => {
		const tagId = this.tags.selectedTagId();
		return {
			url: this.baseUrl,
			withCredentials: true,
			params: {
				page: this.page(),
				limit: PAGE_SIZE,
				...(tagId ? { tagId: tagId, includeDescendants: true } : {})
			}
		};
	},
		{ defaultValue: EMPTY_PAGE }
	);

	// zuletzt geladene seite, bleibt beim laden der naehsten stehen
	readonly shownPage = linkedSignal<{ value: DocumentsPage; loading: boolean }, DocumentsPage>({
		source: () => ({ value: this.list.value(), loading: this.list.isLoading() }),
		computation: (current, previous) =>
			current.loading && previous ? previous.value : current.value,
	});

	// aktuell geoffnetes doc aus query param
	readonly selectedDocId = toSignal(
		this.route.queryParamMap.pipe(map(params => params.get('doc'))),
		{ initialValue: null }
	);

	// detail values nur laden wenn doc ausgewaehlt ist
	readonly detail = httpResource<DocumentSummary>(() => {
		const id = this.selectedDocId();
		return id ? { url: `${this.baseUrl}/${id}`, withCredentials: true } : undefined;
	});

	// ?doc entfernen, ?tag bleibt da
	closeDetail() {
		this.router.navigate([], { queryParams: { doc: null }, queryParamsHandling: 'merge' });
	}

	downloadUrl(id: string) {
		return `${this.baseUrl}/${id}/download`;
	}

	previewUrl(id: string) {
		return `${this.baseUrl}/${id}/preview`;
	}

	addTag(docId: string, tagId: string) {
		return this.http.post<void>(`${this.baseUrl}/${docId}/tags`, { tagId }, { withCredentials: true });
	}

	removeTag(docId: string, tagId: string) {
		return this.http.delete<void>(`${this.baseUrl}/${docId}/tags/${tagId}`, { withCredentials: true });
	}

	deleteDocument(docId: string) {
		return this.http.delete<void>(`${this.baseUrl}/${docId}`, { withCredentials: true });
	}

	renameDocument(docId: string, filename: string) {
		return this.http.patch<{ documentId: string; filename: string }>(
			`${this.baseUrl}/${docId}/filename`, { filename }, { withCredentials: true }
		);
	}

	// drin lassen, vielleicht noch mal benoetigt?
	// setGroup(documentId: string, groupId: string) {
	// 	return this.http.post<void>(`${this.baseUrl}/${documentId}/group`, { groupId }, {
	// 		withCredentials: true
	// 	});
	// }
}
