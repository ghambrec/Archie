import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import type { UserGroupMembership } from '../../users/users';

@Component({
  selector: 'app-profile-groups',
  imports: [DatePipe, TranslocoPipe],
  templateUrl: './profile-groups.html',
})
export class ProfileGroups {
  readonly userGroups = input.required<UserGroupMembership[]>();
}
