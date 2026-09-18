import { Component, ElementRef, signal, viewChild } from '@angular/core';

@Component({
	selector: 'app-doc-upload',
	imports: [],
	templateUrl: './doc-upload.html',
	styleUrl: './doc-upload.scss',
})
export class DocUpload {
	private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

	protected readonly isInDragZone = signal(false); // bool for visual feedback

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

	private handleFiles(files: FileList) {
		console.log([...files]);
	}
}
