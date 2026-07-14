import { Component, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface user
{
	id: string;
	email: string;
	first_name?: string;
	last_name?: string;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
	users = httpResource<user[]>(() => 'http://localhost:3000/users');
}
