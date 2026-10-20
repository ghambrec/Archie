import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbPagination, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Documents } from '../documents';
import { DocStatusBadge } from '../doc-status-badge/doc-status-badge';
import { FileSizePipe } from '../../core/file-size-pipe';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-doc-list',
	imports: [DatePipe, TranslocoPipe, NgbPagination, NgbTooltip, DocStatusBadge, FileSizePipe, RouterLink],
	templateUrl: './doc-list.html',
	styleUrl: './doc-list.scss',
})
export class DocList {
	protected readonly docs = inject(Documents);
}
