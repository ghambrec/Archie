import { Component, inject } from '@angular/core';
import { Tags } from '../../tags/tags';
import { Documents } from '../documents';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
	selector: 'app-doc-breadcrump',
	imports: [RouterLink, TranslocoPipe],
	templateUrl: './doc-breadcrump.html',
	styleUrl: './doc-breadcrump.scss',
})
export class DocBreadcrump {
	protected readonly tags = inject(Tags);
	protected readonly docs = inject(Documents);

	// eigene tags von system tags unterscheiden
	protected isTranslocoKey(label: string) {
		return label.startsWith("tag.label.");
	}
}
