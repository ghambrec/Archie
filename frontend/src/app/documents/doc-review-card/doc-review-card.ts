import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { DocumentsReviewResponse, isAiProcessing } from '../documents-review';
import { TranslocoPipe } from '@jsverse/transloco';
import { PercentPipe } from '@angular/common';
import { DocStatusBadge } from '../doc-status-badge/doc-status-badge';

@Component({
	selector: 'app-doc-review-card',
	imports: [PercentPipe, TranslocoPipe, DocStatusBadge],
	templateUrl: './doc-review-card.html',
	styleUrl: './doc-review-card.scss',
})
export class DocReviewCard {
	readonly doc = input.required<DocumentsReviewResponse>();
	readonly busy = input(false);
	readonly confirmTags = output<string[]>();
	readonly retry = output<void>();

	protected readonly isProcessing = computed(() => isAiProcessing(this.doc().aiStatus));
	protected readonly canRetry = computed(() => this.doc().aiStatus === "FAILED" || this.doc().aiStatus === "NOT_STARTED")

	protected readonly selectedTags = linkedSignal({
		source: () => this.doc().suggestions.map(s => s.tagId).join(','),
		computation: () => new Set(this.doc().suggestions.map(s => s.tagId)),
	});

	protected toggleTag(tagId: string) {
		this.selectedTags.update(current => {
			const next = new Set(current);
			if (next.has(tagId)) {
				next.delete(tagId);
			} else {
				next.add(tagId);
			}
			return next;
		});
	}

	protected onConfirm() {
		this.confirmTags.emit([...this.selectedTags()]);
	}
}
