import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { httpResource } from '@angular/common/http';

export type AiStatus = 'PENDING' | 'PROCESSING' | 'FINISHED' | 'FAILED' | 'SKIPPED' | 'NOT_STARTED';

export interface DocumentsReviewResponse {
	id: string;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	createdAt: string;
	aiStatus: AiStatus;
	aiErrorKey: string | null;
	suggestions: DocumentsReviewResponseSuggestion[];
}

export interface DocumentsReviewResponseSuggestion {
	tagId: string;
	name: string;
	label: string;
	confidence: number;
}

@Service()
export class DocumentsReview {
	private readonly baseUrl = `${environment.apiUrl}/documents-review`;

	readonly queue = httpResource<DocumentsReviewResponse[]>(
		() => ({ url: this.baseUrl, withCredentials: true }),
		{ defaultValue: [] }
	);
}
