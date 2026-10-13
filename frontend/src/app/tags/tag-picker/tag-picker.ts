import { Component, computed, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgbHighlight, NgbTypeahead, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { Tag, Tags } from '../tags';
import { map, OperatorFunction } from 'rxjs';

@Component({
	selector: 'app-tag-picker',
	imports: [NgbTypeahead, NgbHighlight, TranslocoPipe],
	templateUrl: './tag-picker.html',
	styleUrl: './tag-picker.scss',
})
export class TagPicker {
	private readonly tags = inject(Tags);
	private readonly transloco = inject(TranslocoService);

	readonly excludeIds = input<ReadonlySet<string>>(new Set());
	readonly picked = output<Tag>();

	// schon gesetzte tags ausblenden
	private readonly availableTags = computed(
		() => this.tags.tags.value().filter(tag => !this.excludeIds().has(tag.id))
	);

	// tag label uebersetzen
	protected readonly translate = (tag: Tag) => this.transloco.translate(tag.label);

	// tag suche
	protected readonly search: OperatorFunction<string, Tag[]> = (text$) =>
		text$.pipe(
			map(term => term.trim().toLowerCase()),
			map(term => term.length === 0
				? []
				: this.availableTags()
					.filter(tag => this.translate(tag).toLowerCase().includes(term))
					.slice(0, 10)
			)
		);

	// tag selectieren
	protected onSelect(event: NgbTypeaheadSelectItemEvent<Tag>, input: HTMLInputElement) {
		event.preventDefault();
		input.value = '';
		this.picked.emit(event.item);
	}
}
