import { Component, inject } from '@angular/core';
import { DocumentsReview } from '../documents-review';

@Component({
  selector: 'app-doc-review',
  imports: [],
  templateUrl: './doc-review.html',
  styleUrl: './doc-review.scss',
})
export class DocReview {
	protected readonly documentsReviewService = inject(DocumentsReview);

}
