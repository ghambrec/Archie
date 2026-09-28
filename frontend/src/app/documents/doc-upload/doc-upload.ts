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

	private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

	protected readonly isInDragZone = signal(false); // bool for visual feedback
	protected readonly uploads = signal<UploadTask[]>([]);
	protected readonly selectedGroupId = signal<string | null>(null);

	// gruppe selektieren
	onGroupChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		this.selectedGroupId.set(select.value || null);
	}

	// open file picker <input>
	openFilePicker() {
		this.fileInput().nativeElement.click();
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

			this.documentsService.upload(file).subscribe({
				next: (event) => {
					if (event.type === HttpEventType.UploadProgress && event.total) {
						const progress = Math.round((100 * event.loaded) / event.total);
						this.updateTask(task.id, { progress });
					}
					if (event.type === HttpEventType.Response) {
						// TODO: set group direkt uber upload
						const groupId = this.selectedGroupId();
						if (groupId && event.body) {
							this.documentsService.setGroup(event.body.id, groupId).subscribe();
						}
						// TODO ENDE
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
}
