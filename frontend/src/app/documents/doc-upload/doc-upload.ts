import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Documents } from '../documents';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Groups } from '../../groups/groups';

interface UploadTask {
	id: string;
	filename: string;
	progress: number;
	status: 'uploading' | 'done' | 'error';
	errorMessage?: string;
	errorKey?: string;
}

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

	protected readonly isInDragZone = signal(false); // bool for visual feedback
	protected readonly uploads = signal<UploadTask[]>([]);
	protected readonly selectedGroupId = signal<string | null>(null);
	protected readonly uploadGroups = this.groupsService.groupsWithPermission('documents.upload');
	protected readonly uploadConfig = this.documentsService.uploadConfig;

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
			this.documentsService.upload(file, groupId!).subscribe({
				next: (event) => {
					if (event.type === HttpEventType.UploadProgress && event.total) {
						const progress = Math.round((100 * event.loaded) / event.total);
						this.updateTask(task.id, { progress });
					}
					if (event.type === HttpEventType.Response) {
						this.updateTask(task.id, { status: 'done', progress: 100 });
						setTimeout(() => this.removeTask(task.id), 3000);
					}
				},
				error: (err: HttpErrorResponse) => {
					const backendMessage = err.error?.message;
					const message = Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage ?? 'Error';
					this.updateTask(task.id, { status: 'error', errorMessage: message });
				}
			});
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
}
