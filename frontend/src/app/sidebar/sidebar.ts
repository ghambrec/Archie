import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe } from '@jsverse/transloco';
import { Auth } from '../auth/auth';
import { firstValueFrom } from 'rxjs';
import { Users } from '../users/users';
import { DocUpload } from '../documents/doc-upload/doc-upload';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem, TranslocoPipe, DocUpload],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
	protected readonly authService = inject(Auth);
	private readonly router = inject(Router);
	protected readonly usersService = inject(Users)

	async logout () {
		await firstValueFrom(this.authService.logout());
		this.usersService.currentUser.set(null);
		this.router.navigateByUrl('/login');
	}
}
