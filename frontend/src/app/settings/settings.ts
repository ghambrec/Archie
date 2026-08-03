import { Component } from '@angular/core';
import { UserList } from "../users/user-list/user-list";

@Component({
  selector: 'app-settings',
  imports: [UserList],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {}
