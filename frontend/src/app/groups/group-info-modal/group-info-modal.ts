import { Component, computed, inject, signal } from "@angular/core";
import { TranslocoPipe } from "@jsverse/transloco";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { GroupMember, GroupMembersResponse, GroupResponse, Groups, UserPermission } from "../groups";
import { Users } from "../../users/users";
import { EditUserPermissionsModal } from "../edit-user-permissions-modal/edit-user-permissions-modal";
import { httpResource } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Component({
	selector: 'app-info-group-modal',
	imports: [TranslocoPipe],
	templateUrl: './group-info-modal.html',
	styleUrl: './group-info-modal.scss',
})
export class InfoGroupModal {
	readonly selectedGroup = signal<GroupResponse | null>(null);

	readonly members = httpResource<GroupMember[]>(
		() => {
			const group = this.selectedGroup();
			return group
			? { url: `${environment.apiUrl}/user-groups/groups/${group.id}/members`, withCredentials: true}
			: undefined
		},
		{
			defaultValue: [],
			parse: (raw: unknown) => (raw as GroupMembersResponse).members
		}
  );

	protected readonly activeModal = inject(NgbActiveModal);
	private readonly groupsService = inject(Groups);

	private readonly userService = inject(Users);
	protected readonly searchString = signal("");

	readonly actionError = signal<string | null>(null);
	readonly feedbackMsg = signal<string | null>(null);

	readonly permissions = httpResource<UserPermission[]>(
		() => {
			const group = this.selectedGroup();
			return group
			? { url: `${environment.apiUrl}/user-permission/${group.id}/permissions`, withCredentials: true}
			: undefined
		},
		{
			defaultValue: []
		}
	);

	protected readonly filteredUserList = computed(() => {
		if (!this.members.hasValue() || !this.userService.users.hasValue()) {
			return [];
		}

		const search = this.searchString().trim().toLowerCase();

		if (!search) {
			return [];
		}

		return this.userService.users.value().filter(user =>
			!this.members.value().some(member => member.userId === user.id) &&
			(
				user.displayName.toLowerCase().includes(search) ||
				user.email.toLowerCase().includes(search)
			)
		);
	});

	addUserToGroup(userId: string): void {
		this.actionError.set(null);
		this.feedbackMsg.set(null);

		const request = this.groupsService.addUserToGroup(this.selectedGroup()!.id, userId);

		request.subscribe({
			next: () => {
				this.feedbackMsg.set("groups.infoGroup.userAdded");
				this.searchString.set("");
				this.members.reload();
			},
			error: error => {
				let translocoKey = "groups.infoGroup.errorAddingUser";

				if (error.status === 409) {
					translocoKey = "groups.infoGroup.userAlreadyMember";
				}

				this.actionError.set(translocoKey);
			},
		});
	}

	removeUserFromGroup(userId: string): void {
		this.actionError.set(null);
		this.feedbackMsg.set(null);

		const request = this.groupsService.removeUserFromGroup(this.selectedGroup()!.id, userId);

		request.subscribe({
			next: () => {
				this.feedbackMsg.set("groups.infoGroup.userRemoved");
				this.members.reload();
			},
			error: () => {
				this.actionError.set("groups.infoGroup.errorRemovingUser");
			},
		});
	}

	private readonly modalService = inject(NgbModal);

	openUserPermissions(member: GroupMember): void {
		const modal = this.modalService.open(EditUserPermissionsModal,
			{
				centered: true,
			});

		const userPermissions = this.permissions.value().filter(
			permission => permission.userId === member.userId,
		);

		modal.componentInstance.selectedGroup = this.selectedGroup();
		modal.componentInstance.selectedUser = member;
		modal.componentInstance.userPermissions = userPermissions;
		// const groupId = this.selectedGroup.id;
		// const userId = member.userId;

		modal.closed.subscribe(() => {
			this.permissions.reload();
		});
	}

	//filter userPermissions for each user
	getPermissionsForUser(userId: string): string[] {
		if (!this.permissions.hasValue()) {
			return [];
		}

		const filteredPermissions = this.permissions.value().filter(permission => permission.userId === userId);

		return filteredPermissions.map(permission => permission.permKey);
	}

	closeModal(): void {
		this.activeModal.dismiss();
	}

}