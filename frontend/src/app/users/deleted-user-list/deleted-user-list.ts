import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import type { UserInfo } from '../users';

@Component({
  selector: 'app-deleted-user-list',
  imports: [DatePipe, TranslocoPipe],
  templateUrl: './deleted-user-list.html',
  styles: [':host { display: block; }'],
})
export class DeletedUserList {
  readonly users = input.required<readonly UserInfo[]>();
  readonly showEmpty = input(true);
  readonly restoreRequested = output<UserInfo>();
}
