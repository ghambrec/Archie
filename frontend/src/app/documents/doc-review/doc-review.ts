import { Component, inject, signal } from '@angular/core';
import { DocumentsReview } from '../documents-review';
import { TranslocoPipe } from '@jsverse/transloco';
import { DocReviewCard } from '../doc-review-card/doc-review-card';
import { Tags } from '../../tags/tags';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
	selector: 'app-doc-review',
	imports: [TranslocoPipe, DocReviewCard],
	templateUrl: './doc-review.html',
	styleUrl: './doc-review.scss',
})
export class DocReview {
	protected readonly reviewService = inject(DocumentsReview);
	private readonly tags = inject(Tags);

	protected readonly busyIds = signal<Set<string>>(new Set());
	protected readonly actionError = signal<string | null>(null); // transloco

	private setBusy(docId: string, busy: boolean) {
		this.busyIds.update(current => {
			const next = new Set(current);
			if (busy) {
				next.add(docId);
			} else {
				next.delete(docId);
			}
			return next;
		});
	}

	protected onConfirm(docId: string, tagIds: string[]) {
		this.setBusy(docId, true);
		this.actionError.set(null);

		this.reviewService.confirmTags(docId, tagIds).subscribe({
			next: () => {
				this.setBusy(docId, false);
				this.reviewService.queue.reload();
				this.tags.tagDocsList.reload();
			},
			error: (err: HttpErrorResponse) => {
				this.setBusy(docId, false);
				this.actionError.set(this.toErrorKey(err));
			},
		});
	}

	private toErrorKey(err: HttpErrorResponse): string {
		const code = err.error?.code;
		return code ? `errors.${code}` : 'errors.UNKNOWN';
	}

	protected onRetry(docId: string) {
		this.setBusy(docId, true);
		this.actionError.set(null);

		this.reviewService.retryAiIngestion(docId).subscribe({
			next: () => {
				this.setBusy(docId, false);
				this.reviewService.queue.reload();
			},
			error: (err: HttpErrorResponse) => {
				this.setBusy(docId, false);
				this.actionError.set(this.toErrorKey(err));
			},
		});
	}
}
