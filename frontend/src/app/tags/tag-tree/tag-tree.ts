import { Component, computed, inject, signal } from '@angular/core';
import { filterTagTree, Tags } from '../tags';
import { Translation, TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { TagTreeItem } from '../tag-tree-item/tag-tree-item';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
	selector: 'app-tag-tree',
	imports: [TranslocoPipe, TagTreeItem],
	templateUrl: './tag-tree.html',
	styleUrl: './tag-tree.scss',
})
export class TagTree {
	protected readonly tagsService = inject(Tags);
	protected readonly searchString = signal("");
	protected readonly isSearching = computed(() => this.searchString().trim() !== "");

	private readonly translocoService = inject(TranslocoService);

	private readonly translation = toSignal(
		this.translocoService.selectTranslation(),
		{ initialValue: {} as Translation }
	);

	private translateLabel(label: string): string {
		return this.translation()[label] ?? label;
	}

	protected readonly filteredTagTree = computed(() => {
		const search = this.searchString().trim().toLowerCase();
		const tree = this.tagsService.tagTree();
		if (!search) {
			return tree;
		}

		return filterTagTree(
			tree,
			node => this.translateLabel(node.label).toLowerCase().includes(search)
		);
	});
}
