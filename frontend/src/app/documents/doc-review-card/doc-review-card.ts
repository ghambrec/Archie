import { Component, computed, input } from '@angular/core';
import { DocumentsReviewResponse } from '../documents-review';
import { TranslocoPipe } from '@jsverse/transloco';
import { PercentPipe } from '@angular/common';

@Component({
  selector: 'app-doc-review-card',
  imports: [PercentPipe, TranslocoPipe],
  templateUrl: './doc-review-card.html',
  styleUrl: './doc-review-card.scss',
})
export class DocReviewCard {
	readonly doc = input.required<DocumentsReviewResponse>();

	readonly isProcessing = computed(() => this.doc().aiStatus === "PROCESSING" || this.doc().aiStatus === "PENDING");
}
