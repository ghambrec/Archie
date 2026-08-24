import { Component } from '@angular/core';
import { UserList } from "../users/user-list/user-list";
import { GroupList } from '../groups/group-list/group-list';

@Component({
  selector: 'app-settings',
  imports: [UserList, GroupList],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {}
