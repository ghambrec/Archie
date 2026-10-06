import { Component, computed, input, signal } from '@angular/core';
import { TagNode } from '../tags';

@Component({
	selector: 'app-tag-tree-item',
	imports: [],
	templateUrl: './tag-tree-item.html',
	styleUrl: './tag-tree-item.scss',
})
export class TagTreeItem {
	readonly tagNode = input.required<TagNode>();

	protected readonly expanded = signal(false);
	protected readonly hasChilds = computed(() => this.tagNode().children.length > 0);

	protected toggle() {
		this.expanded.update(value => !value);
	}
}
