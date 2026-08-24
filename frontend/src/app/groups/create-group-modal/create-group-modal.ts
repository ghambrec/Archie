import { Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-create-group-modal',
	imports: [],
	templateUrl: './create-group-modal.html',
	styleUrl: './create-group-modal.scss',
})
export class CreateGroupModal {
	protected readonly activeModal = inject(NgbModal);
	
 }
	

