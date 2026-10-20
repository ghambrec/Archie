import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import type { UserInfo } from '../users';

@Component({
  selector: 'app-user-table',
  imports: [TranslocoPipe],
  templateUrl: './user-table.html',
  styles: [':host { display: block; }'],
})
export class UserTable {
  readonly users = input.required<readonly UserInfo[]>();
  readonly avatarUrl = input.required<(userId: string) => string>();
  readonly showEmpty = input(true);
  readonly createRequested = output<void>();
  readonly infoRequested = output<UserInfo>();
  readonly editRequested = output<UserInfo>();
  readonly deleteRequested = output<UserInfo>();
}
