import { Component, inject, signal } from "@angular/core";
import { TranslocoPipe } from "@jsverse/transloco";
import { GroupMember, GroupMembersResponse, GroupResponse, Groups, UserPermission } from "../groups";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { forkJoin, Observable } from "rxjs";

@Component({
  selector: "app-edit-user-permissions-modal",
  imports: [TranslocoPipe],
  templateUrl: "./edit-user-permissions-modal.html",
  styleUrl: "./edit-user-permissions-modal.scss",
})
export class EditUserPermissionsModal {
  selectedGroup!: GroupResponse;
  selectedUser!: GroupMember;
  userPermissions!: UserPermission[];

  protected readonly availablePermissions = [
	{ key: "documents.read",	label: "groups.userPermissions.documentsRead" },
	{ key: "documents.upload",	label: "groups.userPermissions.documentsUpload" },
	{ key: "documents.update",	label: "groups.userPermissions.documentsUpdate" },
	{ key: "documents.delete",	label: "groups.userPermissions.documentsDelete" },
  ];

  protected readonly activeModal = inject(NgbActiveModal);

  readonly selectedPermissions = signal<Set<string>>(new Set());

  private readonly groupsService = inject(Groups);

  ngOnInit(): void {
    this.selectedPermissions.set(
      new Set(this.userPermissions.map(permission => permission.permKey))
    );
  }

  // hasPermission(permissionKey: string): boolean {
  //   return this.userPermissions.some(
  //     permission =>  permission.permKey === permissionKey
  //   );
  // }

  hasPermission(permissionsKey: string): boolean {
    return this.selectedPermissions().has(permissionsKey);
  }

  setPermission(permissionKey: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const permissions = new Set(this.selectedPermissions());

    if (checked) {
      permissions.add(permissionKey);
    } else {
      permissions.delete(permissionKey);
    }
    
    this.selectedPermissions.set(permissions);
  }

  save(): void {
    const initialPermissions = new Set(
      this.userPermissions.map(permission => permission.permKey)
    );

    const currentPermissions = this.selectedPermissions();

    const permissionsToAdd = [...currentPermissions].filter(
      permission => !initialPermissions.has(permission),
    );

    const permissionsToRemove = [...initialPermissions].filter(
      permission => !currentPermissions.has(permission),
    );
    
    const requests: Observable<unknown>[] = [
      ...permissionsToAdd.map(permission =>
        this.groupsService.addUserPermission(this.selectedGroup.id,
          this.selectedUser.userId,
          permission,
        )
      ),
      ...permissionsToRemove.map(permission =>
        this.groupsService.removeUserPermissions(this.selectedGroup.id,
          this.selectedUser.userId,
          permission,
        )
      ),
    ];

    if (requests.length === 0) {
      this.activeModal.close();
      return;
    }

    forkJoin(requests).subscribe({
      next: () => this.activeModal.close(true),
      error: error => {
        console.error("Unable to update user permissions", error);
      },
    });
  }
}