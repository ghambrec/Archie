import { Component, computed, input } from '@angular/core';
import { AiStatus } from '../documents-review';
import { TranslocoPipe } from '@jsverse/transloco';

interface StatusConfig {
	cssClass: string;
	translocoKey: string;
	spinner: boolean;
}

const STATUS_CONFIG: Record<AiStatus, StatusConfig> = {
	NOT_STARTED: { cssClass: 'text-bg-secondary', translocoKey: 'documents.aiStatus.notStarted', spinner: false },
	PENDING: { cssClass: 'text-bg-info', translocoKey: 'documents.aiStatus.pending', spinner: true },
	PROCESSING: { cssClass: 'text-bg-info', translocoKey: 'documents.aiStatus.processing', spinner: true },
	FINISHED: { cssClass: 'text-bg-success', translocoKey: 'documents.aiStatus.finished', spinner: false },
	FAILED: { cssClass: 'text-bg-danger', translocoKey: 'documents.aiStatus.failed', spinner: false },
	SKIPPED: { cssClass: 'text-bg-warning', translocoKey: 'documents.aiStatus.skipped', spinner: false },
};

@Component({
	selector: 'app-doc-status-badge',
	imports: [TranslocoPipe],
	templateUrl: './doc-status-badge.html',
	styleUrl: './doc-status-badge.scss',
})
export class DocStatusBadge {
	readonly status = input.required<AiStatus>();
	protected readonly config = computed(() => STATUS_CONFIG[this.status()]);
}
