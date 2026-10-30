import { Component, computed, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Documents, DocumentSummary } from '../documents';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
	selector: 'app-doc-preview-modal',
	imports: [],
	templateUrl: './doc-preview-modal.html',
	styleUrl: './doc-preview-modal.scss',
})
export class DocPreviewModal {
	protected readonly activeModal = inject(NgbActiveModal);
	private readonly docs = inject(Documents);
	private readonly sanitizer = inject(DomSanitizer);

	readonly doc = signal<DocumentSummary | null>(null);

	protected readonly isImage = computed(() => this.doc()?.mimeType.startsWith('image/') ?? false);

	protected readonly url = computed(() => {
		const doc = this.doc();
		return doc ? this.docs.previewUrl(doc.id) : '';
	});

	protected readonly frameUrl = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(this.url()));
}

