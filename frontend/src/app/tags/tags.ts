import { computed, inject, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { httpResource } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

export interface Tag {
	id: string;
	name: string;
	label: string;
	parentId: string | null;
}

export interface TagResponse extends Tag {
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

export function filterTagTree(nodes: TagNode[], matches: (node: TagNode) => boolean): TagNode[] {
	const result: TagNode[] = [];
	for (const node of nodes) {
		// gefunden -> knoten mit allen kindern behalten
		if (matches(node)) {
			result.push(node);
			continue;
		}

		// nicht gefunden -> nur behalten, wenn ein kind davon passt
		const matchingChildren = filterTagTree(node.children, matches);
		if (matchingChildren.length > 0) {
			result.push({ ...node, children: matchingChildren });
		}
	}
	return result;
}

@Service()
export class Tags {
	private readonly baseUrl = `${environment.apiUrl}/tags`;

	// alle tags
	readonly tags = httpResource<Tag[]>(
		() => ({ url: this.baseUrl, withCredentials: true }),
		{ defaultValue: [] }
	);

	// falche tag liste aller docs
	readonly tagDocsList = httpResource<TagResponse[]>(
		() => ({ url: `${this.baseUrl}/with-docs`, withCredentials: true }),
		{ defaultValue: [] }
	);

	// tag baum
	readonly tagTree = computed(() => buildTagTree(this.tagDocsList.value()));

	// aktuell ausgewaehlte tag id
	private readonly route = inject(ActivatedRoute);
	readonly selectedTagId = toSignal(
		this.route.queryParamMap.pipe(map(params => params.get('tag'))),
		{ initialValue: null }
	)

	// map mit id und TagResponse, zum nachschlagen fuer parents
	private readonly tagsById = computed(
		() => new Map<string, TagResponse>(this.tagDocsList.value().map(tag => [tag.id, tag]))
	)

	// return all parent ids from the current selected tag
	readonly selectedParentIds = computed(() => {
		const parentIds = new Set<string>();
		const selectedId = this.selectedTagId();
		if (!selectedId) {
			return parentIds;
		}

		const tagsById = this.tagsById();
		let current = tagsById.get(selectedId);
		while (current?.parentId && !parentIds.has(current.parentId)) {
			parentIds.add(current.parentId);
			current = tagsById.get(current.parentId);
		}
		return parentIds;
	});

	// fuer brotkruemelnavigation: tag kette von root bis aktueller tag
	readonly selectedTagPath = computed(() => {
		const path: TagResponse[] = [];
		const selectedId = this.selectedTagId();
		if (!selectedId) {
			return path;
		}

		const tagsById = this.tagsById();
		let current = tagsById.get(selectedId);
		while (current && !path.includes(current)) {
			path.unshift(current);
			current = current.parentId ? tagsById.get(current.parentId) : undefined;
		}
		return path;
	});
}
