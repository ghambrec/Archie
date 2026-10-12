import { Component, inject } from '@angular/core';
import { DocumentsReview } from '../documents-review';
import { TranslocoPipe } from '@jsverse/transloco';
import { DocReviewCard } from '../doc-review-card/doc-review-card';

@Component({
  selector: 'app-doc-review',
  imports: [TranslocoPipe, DocReviewCard],
  templateUrl: './doc-review.html',
  styleUrl: './doc-review.scss',
})
export class DocReview {
	protected readonly reviewService = inject(DocumentsReview);

}
