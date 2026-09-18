import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Documents } from '../documents';
import { HttpEventType } from '@angular/common/http';

@Component({
	selector: 'app-doc-upload',
	imports: [],
	templateUrl: './doc-upload.html',
	styleUrl: './doc-upload.scss',
})
export class DocUpload {
	private readonly documentsService = inject(Documents);
	private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

	protected readonly isInDragZone = signal(false); // bool for visual feedback
	protected readonly uploadProgress = signal<number | null>(null);

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
		for (const file of files) {
			this.documentsService.upload(file).subscribe((event) => {
				switch (event.type) {
					case HttpEventType.UploadProgress:
						if (event.total) {
							this.uploadProgress.set(Math.round((100 * event.loaded) / event.total));
						}
						break;
					case HttpEventType.Response:
						console.log('upload finished: ', event.body);
						this.uploadProgress.set(null);
						break;
				}
			});
		}
	}
}
