import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import type { UserGroupMembership } from '../../users/users';

const PERMISSION_LABEL_KEYS: Readonly<Record<string, string>> = {
  admin: 'groups.userPermissions.admin',
  'documents.read': 'groups.userPermissions.documentsRead',
  'documents.upload': 'groups.userPermissions.documentsUpload',
  'documents.update': 'groups.userPermissions.documentsUpdate',
  'documents.delete': 'groups.userPermissions.documentsDelete',
};

@Component({
  selector: 'app-profile-groups',
  imports: [DatePipe, TranslocoPipe],
  templateUrl: './profile-groups.html',
})
export class ProfileGroups {
  readonly userGroups = input.required<UserGroupMembership[]>();
  readonly displayGroups = computed(() => this.userGroups().map(group => ({
    ...group,
    permissions: group.permissions.map(key => ({
      key,
      labelKey: Object.hasOwn(PERMISSION_LABEL_KEYS, key) ? PERMISSION_LABEL_KEYS[key] : undefined,
    })),
  })));
}
