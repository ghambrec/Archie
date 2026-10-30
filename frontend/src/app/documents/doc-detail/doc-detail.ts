import { Component, computed, effect, ElementRef, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { Documents, DocumentSummary } from '../documents';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FileSizePipe } from '../../core/file-size-pipe';
import { DocStatusBadge } from '../doc-status-badge/doc-status-badge';
import { DocumentsReview, isAiProcessing } from '../documents-review';
import { Tag, Tags } from '../../tags/tags';
import { Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { toErrorKey } from '../../core/error-key';
import { TagPicker } from '../../tags/tag-picker/tag-picker';
import { DocPreviewModal } from '../doc-preview-modal/doc-preview-modal';

@Component({
	selector: 'app-doc-detail',
	imports: [DatePipe, UpperCasePipe, TranslocoPipe, NgbTooltip, FileSizePipe, DocStatusBadge, TagPicker],
	templateUrl: './doc-detail.html',
	styleUrl: './doc-detail.scss',
	host: { '(document:keydown.escape)': 'onEscape()' }
})
export class DocDetail {
	protected readonly docs = inject(Documents);
	private readonly review = inject(DocumentsReview);
	private readonly tags = inject(Tags);
	private readonly transloco = inject(TranslocoService);
	private readonly modalService = inject(NgbModal);

	protected readonly busy = signal(false);

	// zuruecksetzen wenn ein anderes doc geoeffnet wird
	protected readonly actionError = linkedSignal<string | null, string | null>({
		source: this.docs.selectedDocId,
		computation: () => null,
	});
	protected readonly confirmDelete = linkedSignal({
		source: this.docs.selectedDocId,
		computation: () => false,
	});

	// edit modus zuruecksetzen wenn anderes doc geoeffnet wird
	protected readonly editingName = linkedSignal({
		source: this.docs.selectedDocId,
		computation: () => false,
	});
	protected readonly nameDraft = signal('');

	// endung bleibt fix, wird nur angezeigt
	protected readonly fileExtension = computed(() =>
		this.docs.detail.hasValue() ? splitFilename(this.docs.detail.value().filename).extension : ''
	);

	private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

	// tags die doc schon hat im picker ausblenden
	protected readonly usedTagIds = computed(() =>
		new Set(this.docs.detail.hasValue() ? this.docs.detail.value().tags.map(tag => tag.id) : [])
	);

	private readonly isProcessing = computed(() =>
		this.docs.detail.hasValue() && isAiProcessing(this.docs.detail.value().aiStatus)
	);

	constructor() {
		// detail ansicht aktualisieren wenn ki noch laeuft
		effect((onCleanup) => {
			if (!this.isProcessing()) {
				return;
			}
			const intervalId = setInterval(() => this.docs.detail.reload(), 3000);
			onCleanup(() => clearInterval(intervalId));
		});

		// input fokussieren + text markieren sobald edit modus an ist
		effect(() => this.nameInput()?.nativeElement.select());
	}

	protected onAddTag(docId: string, tag: Tag) {
		this.run(this.docs.addTag(docId, tag.id), () => this.refreshDoc());
	}

	protected onRemoveTag(docId: string, tagId: string) {
		this.run(this.docs.removeTag(docId, tagId), () => this.refreshDoc());
	}

	protected onRetry(docId: string) {
		this.run(this.review.retryAiIngestion(docId), () => {
			this.docs.detail.reload();
			this.review.queue.reload();
		});
	}

	// loeschen logik abfrage zum bestaetigen
	protected onDelete(docId: string) {
		if (!this.confirmDelete()) {
			this.confirmDelete.set(true);
			return;
		}
		this.run(this.docs.deleteDocument(docId), () => {
			this.docs.closeDetail();
			this.docs.list.reload();
			this.tags.tagDocsList.reload();
			this.review.queue.reload();
		});
	}

	protected openPreview(doc: DocumentSummary) {
		const modal = this.modalService.open(DocPreviewModal, { size: 'xl', centered: true });
		modal.componentInstance.doc.set(doc);
	}

	protected startRename(filename: string) {
		this.nameDraft.set(splitFilename(filename).basename);
		this.actionError.set(null);
		this.editingName.set(true);
	}

	protected saveRename(doc: DocumentSummary) {
		const name = this.nameDraft().trim();
		if (!name) {
			return;
		}
		if (name === splitFilename(doc.filename).basename) {
			this.editingName.set(false);
			return;
		}
		this.run(this.docs.renameDocument(doc.id, name), () => {
			this.editingName.set(false);
			this.refreshDoc();
		});
	}

	// name + tags werden in liste und tag ansicht angezeigt
	private refreshDoc() {
		this.docs.detail.reload();
		this.docs.list.reload();
		this.tags.tagDocsList.reload();
	}

	// bei escape: erst edit abbrechen, sonst schliessen wenn kein preview offen
	protected onEscape() {
		if (this.editingName()) {
			this.editingName.set(false);
			return;
		}
		if (!this.modalService.hasOpenModals()) {
			this.docs.closeDetail();
		}
	}

	// fuer alle aktionen gleich: busy setzen, reset error, subscript
	private run(request: Observable<unknown>, onSuccess: () => void) {
		this.busy.set(true);
		this.actionError.set(null);
		request.subscribe({
			next: () => {
				this.busy.set(false);
				onSuccess();
			},
			error: (err: HttpErrorResponse) => {
				this.busy.set(false);
				this.actionError.set(toErrorKey(err, this.transloco));
			},
		});
	}
}

function splitFilename(filename: string) {
	const dot = filename.lastIndexOf('.');
	return dot > 0
		? { basename: filename.slice(0, dot), extension: filename.slice(dot) }
		: { basename: filename, extension: '' };
}
