import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe } from '@jsverse/transloco';
import { Auth } from '../auth/auth';
import { firstValueFrom } from 'rxjs';
import { Users } from '../users/users';
import { DocUpload } from '../documents/doc-upload/doc-upload';
import { TagTree } from '../tags/tag-tree/tag-tree';
import { ChatSidebar } from '../ai-chat/chat-sidebar/chat-sidebar';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgbDropdown, NgbDropdownToggle, 
	NgbDropdownMenu, NgbDropdownItem, TranslocoPipe, DocUpload, TagTree, ChatSidebar],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
	protected readonly authService = inject(Auth);
	protected readonly usersService = inject(Users)


	async logout () {
		await firstValueFrom(this.authService.logout());
		window.location.assign("/login");
	}
}
