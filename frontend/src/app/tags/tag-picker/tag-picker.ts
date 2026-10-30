import { Component, computed, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgbHighlight, NgbTypeahead, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { Tag, Tags } from '../tags';
import { map, merge, OperatorFunction, Subject } from 'rxjs';

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

	// "+ tag" oder suchfeld
	protected readonly editing = signal(false);
	private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('tagInput');

	constructor() {
		// suchfeld fokussieren sobald es da ist
		effect(() => this.inputRef()?.nativeElement.focus());
	}

	// klick ins suchfeld -> komplette liste anzeigen
	protected readonly open$ = new Subject<string>();

	private readonly allTags = computed(() => this.tags.tags.hasValue() ? this.tags.tags.value() : []);

	// map id -> tag, fuer parent label
	private readonly tagsById = computed(
		() => new Map(this.allTags().map(tag => [tag.id, tag]))
	);

	// schon gesetzte tags ausblenden
	private readonly availableTags = computed(() =>
		this.allTags()
			.filter(tag => !this.excludeIds().has(tag.id))
			.sort((a, b) => this.translate(a).localeCompare(this.translate(b)))
	);

	// tag label uebersetzen
	protected readonly translate = (tag: Tag) => this.transloco.translate(tag.label);

	// label vom parent holen
	protected readonly parentLabel = (tag: Tag): string | null => {
		const parent = tag.parentId ? this.tagsById().get(tag.parentId) : undefined;
		return parent ? this.translate(parent) : null;
	};

	// tag suche: leer -> alle tags, ansonsten suche im tag oder parent tag
	protected readonly search: OperatorFunction<string, Tag[]> = (text$) =>
		merge(text$, this.open$).pipe(
			map(term => term.trim().toLowerCase()),
			map(term => this.availableTags().filter(tag =>
				term.length === 0
				|| this.translate(tag).toLowerCase().includes(term)
				|| (this.parentLabel(tag)?.toLowerCase().includes(term) ?? false)
			))
		);

	// tag selectieren
	protected onSelect(event: NgbTypeaheadSelectItemEvent<Tag>) {
		event.preventDefault();
		this.picked.emit(event.item);
		this.editing.set(false);
	}

	// suchfeld nur schliessen wenn leer, sonst geht der klick ins dropdown verloren
	protected onBlur(input: HTMLInputElement) {
		if (!input.value) {
			this.editing.set(false);
		}
	}
}
