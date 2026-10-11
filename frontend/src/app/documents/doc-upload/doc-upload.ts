import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Documents } from '../documents';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Groups } from '../../groups/groups';
import { Subscription } from 'rxjs';

interface UploadTask {
	id: string;
	filename: string;
	progress: number;
	status: 'uploading' | 'done' | 'error';
	errorKey?: string;
}

const UPLOAD_ERROR_KEYS: Record<string, string> = {
	DOCUMENT_FILE_EMPTY: "documents.upload.errors.empty",
	DOCUMENT_FILE_TYPE_NOT_ALLOWED: "documents.upload.errors.filetypeNotAllowed",
	DOCUMENT_FILE_TYPE_MISMATCH: "documents.upload.errors.filetypeMismatch",
	DOCUMENT_ALREADY_EXISTS_IN_GROUP: "documents.upload.errors.alreadyExists",
};

@Component({
	selector: 'app-doc-upload',
	imports: [TranslocoPipe, NgbTooltip],
	templateUrl: './doc-upload.html',
	styleUrl: './doc-upload.scss',
})
export class DocUpload {
	private readonly documentsService = inject(Documents);
	protected readonly groupsService = inject(Groups);

	private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
	private readonly subscriptions = new Map<string, Subscription>();

	protected readonly isInDragZone = signal(false); // bool for visual feedback
	protected readonly uploads = signal<UploadTask[]>([]);
	protected readonly selectedGroupId = signal<string | null>(null);
	protected readonly uploadGroups = this.groupsService.groupsWithPermission('documents.upload');
	protected readonly uploadConfig = this.documentsService.uploadConfig;

	protected readonly maxSizeMb = computed(() => {
		const bytes = this.uploadConfig.value()?.maxSizeBytes;
		return bytes ? Math.round(bytes / 1024 / 1024) : null;
	});

	// gruppe selektieren
	onGroupChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		this.selectedGroupId.set(select.value || null);
	}

	// open file picker <input>
	openFilePicker() {
		this.fileInput()?.nativeElement.click();
	}

	// file picker change event
	onFilesSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files) {
			return;
		}
		this.handleFiles(input.files);
		input.value = '';
	}

	// entered drag drop zone
	onDragIn(event: DragEvent) {
		event.preventDefault();
		this.isInDragZone.set(true);
	}

	// leaved drag drop zone
	onDragOut(event: DragEvent) {
		event.preventDefault();
		this.isInDragZone.set(false);
	}

	// dropped files in drag drop zone
	onDrop(event: DragEvent) {
		event.preventDefault();
		this.isInDragZone.set(false);

		const files = event.dataTransfer?.files;
		if (!files) {
			return;
		}
		this.handleFiles(files);
	}

	// files uploaden ueber documentsService
	private handleFiles(files: FileList) {
		if (!this.selectedGroupId()) {
			return;
		}

		for (const file of files) {

			const task: UploadTask = {
				id: crypto.randomUUID(),
				filename: file.name,
				progress: 0,
				status: 'uploading'
			};
			this.uploads.update((tasks) => [...tasks, task]);

			// file validation
			const errorKey = this.validateFile(file);
			if (errorKey) {
				this.updateTask(task.id, { status: 'error', errorKey})
				continue;
			}

			const groupId = this.selectedGroupId();
			const subscription = this.documentsService.upload(file, groupId!).subscribe({
				next: (event) => {
					if (event.type === HttpEventType.UploadProgress && event.total) {
						const progress = Math.round((100 * event.loaded) / event.total);
						this.updateTask(task.id, { progress });
					}
					if (event.type === HttpEventType.Response) {
						this.subscriptions.delete(task.id);
						this.updateTask(task.id, { status: 'done', progress: 100 });
						setTimeout(() => this.removeTask(task.id), 3000);
					}
				},
				error: (err: HttpErrorResponse) => {
					this.subscriptions.delete(task.id);
					this.updateTask(task.id, { status: 'error', errorKey: this.toTranslocoErrorKey(err) });
				}
			});
			this.subscriptions.set(task.id, subscription);
		}
	}

	private updateTask(id: string, changes: Partial<UploadTask>) {
		this.uploads.update((tasks) => 
			tasks.map((t) => ( t.id === id ? {...t, ...changes } : t))
		);
	}

	private removeTask(id: string) {
		this.uploads.update((tasks) => tasks.filter((t) => t.id !== id));
	}

	protected cancelTask(id: string) {
		this.subscriptions.get(id)?.unsubscribe();
		this.subscriptions.delete(id);
		this.removeTask(id);
	}

	// null = file ok / else transloco key
	private validateFile(file: File): string | null {
		const config = this.uploadConfig.value();
		if (!config) {
			return null; // config not ready yet or request failed, upload file anyway, backend will do validation
		}

		if (file.size === 0) {
			return "documents.upload.errors.empty";
		}
		if (file.size > config.maxSizeBytes) {
			return "documents.upload.errors.tooBig";
		}
		if (!config.allowedExtensions.includes(this.getExtension(file.name))) {
			return "documents.upload.errors.filetypeNotAllowed";
		}
		return null;
	}

	private getExtension(filename: string): string {
		const dot = filename.lastIndexOf('.');
		return dot > 0 ? filename.slice(dot).toLowerCase() : '';
	}

	// translate backend error keys into transloco keys
	private toTranslocoErrorKey(err: HttpErrorResponse): string {
		if (err.status === 413) {
			return "documents.upload.errors.tooBig";
		}
		return UPLOAD_ERROR_KEYS[err.error?.code] ?? "documents.upload.errors.unknown";
	}
}
