import { Component, computed, effect, inject, signal } from '@angular/core';
import { DocumentsReview, isAiProcessing } from '../documents-review';
import { TranslocoPipe } from '@jsverse/transloco';
import { DocReviewCard } from '../doc-review-card/doc-review-card';
import { Tags } from '../../tags/tags';
import { HttpErrorResponse } from '@angular/common/http';
import { Documents } from '../documents';
import { toErrorKey } from '../../core/error-key';

@Component({
	selector: 'app-doc-review',
	imports: [TranslocoPipe, DocReviewCard],
	templateUrl: './doc-review.html',
	styleUrl: './doc-review.scss',
})
export class DocReview {
	constructor() {
		// wenn processing docs dann liste alle 3s aktualisieren
		effect(onCleanup => {
			if (!this.hasProcessingDocs()) {
				return ;
			}
			const intervalId = setInterval(() => this.reviewService.queue.reload(), 3000);
			onCleanup(() => clearInterval(intervalId));
		})
	}

	protected readonly reviewService = inject(DocumentsReview);
	private readonly tags = inject(Tags);
	private readonly documentsService = inject(Documents);

	protected readonly busyIds = signal<Set<string>>(new Set());
	protected readonly actionError = signal<string | null>(null); // transloco

	private readonly hasProcessingDocs = computed(() => this.reviewService.queue.value().some(doc => isAiProcessing(doc.aiStatus)));

	// doc auf busy setzen damit nicht zwei mal hintereinander buttons gedrueckt werden koennen
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

	// tags bestaetigen
	protected onConfirm(docId: string, tagIds: string[]) {
		this.setBusy(docId, true);
		this.actionError.set(null);

		this.reviewService.confirmTags(docId, tagIds).subscribe({
			next: () => {
				this.setBusy(docId, false);
				this.reviewService.queue.reload();
				this.tags.tagDocsList.reload();
				this.documentsService.list.reload();
			},
			error: (err: HttpErrorResponse) => {
				this.setBusy(docId, false);
				this.actionError.set(toErrorKey(err));
			},
		});
	}

	// ingestion retryen
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
				this.actionError.set(toErrorKey(err));
			},
		});
	}
}
