import { Component, inject } from '@angular/core';
import { Tags } from '../tags';
import { TranslocoPipe } from '@jsverse/transloco';
import { TagTreeItem } from '../tag-tree-item/tag-tree-item';

@Component({
	selector: 'app-tag-tree',
	imports: [TranslocoPipe, TagTreeItem],
	templateUrl: './tag-tree.html',
	styleUrl: './tag-tree.scss',
})
export class TagTree {
	protected readonly tagsService = inject(Tags);
}
