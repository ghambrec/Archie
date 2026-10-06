import { computed, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { httpResource } from '@angular/common/http';

export interface TagResponse {
	id: string;
	name: string;
	label: string;
	parentId: string | null;
	documentCount: number;
}

export interface TagNode extends TagResponse {
	children: TagNode[];
}

function buildTagTree(tags: TagResponse[]): TagNode[] {
	// map mit id von tag
	const nodesById = new Map<string, TagNode>();
	for (const tag of tags) {
		nodesById.set(tag.id, { ...tag, children: [] });
	}

	// map durchgehen, parents suchen, roots fuellen
	const roots: TagNode[] = [];
	for (const node of nodesById.values()) {
		const parent = node.parentId ? nodesById.get(node.parentId) : undefined;
		if (parent) {
			parent.children.push(node);
		} else {
			roots.push(node);
		}
	}
	return roots;
}

@Service()
export class Tags {
	private readonly baseUrl = `${environment.apiUrl}/tags`;

	// falche tag liste aller docs
	readonly tagDocsList = httpResource<TagResponse[]>(
		() => ({ url: `${this.baseUrl}/with-docs`, withCredentials: true }),
		{ defaultValue: [] }
	);

	// tag baum
	readonly tagTree = computed(() => buildTagTree(this.tagDocsList.value()));
}
