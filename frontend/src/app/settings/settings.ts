import { Component } from '@angular/core';
import { CreateUserForm } from "../users/create-user-form/create-user-form";
import { UserList } from "../users/user-list/user-list";

@Component({
  selector: 'app-settings',
  imports: [CreateUserForm, UserList],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {}
