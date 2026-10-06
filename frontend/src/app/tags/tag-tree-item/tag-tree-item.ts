import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { TagNode, Tags } from '../tags';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
	selector: 'app-tag-tree-item',
	imports: [RouterLink, TranslocoPipe],
	templateUrl: './tag-tree-item.html',
	styleUrl: './tag-tree-item.scss',
})
export class TagTreeItem {
	readonly tagNode = input.required<TagNode>();

	private readonly tagsService = inject(Tags);

	protected readonly hasChilds = computed(() => this.tagNode().children.length > 0);
	protected readonly expanded = linkedSignal({
		source: () => this.tagsService.selectedParentIds().has(this.tagNode().id),
		computation: (isParent, previous) => isParent || (previous?.value ?? false)
	});

	protected toggle() {
		this.expanded.update(value => !value);
	}

	protected readonly isSelected = computed(
		() => this.tagsService.selectedTagId() === this.tagNode().id
	);
}
