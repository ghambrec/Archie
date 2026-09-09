import { Component, inject, signal } from "@angular/core";
import { TranslocoPipe } from "@jsverse/transloco";
import { GroupMember, GroupMembersResponse, GroupResponseAdmin, UserPermission } from "../groups";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-edit-user-permissions-modal",
  imports: [TranslocoPipe],
  templateUrl: "./edit-user-permissions-modal.html",
  styleUrl: "./edit-user-permissions-modal.scss",
})
export class EditUserPermissionsModal {
  selectedGroup!: GroupResponseAdmin;
  selectedUser!: GroupMember;
  userPermissions!: UserPermission[];


  protected readonly activeModal = inject(NgbActiveModal);

  readonly selectedPermissions = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.selectedPermissions.set(
      new Set(this.userPermissions.map(permission => permission.permKey))
    );
  }

  hasPermission(permissionKey: string): boolean {
    return this.userPermissions.some(
      permission =>  permission.permKey === permissionKey
    );
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
  }
}