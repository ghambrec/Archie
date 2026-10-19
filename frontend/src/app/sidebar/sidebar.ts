import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe } from '@jsverse/transloco';
import { Auth } from '../auth/auth';
import { firstValueFrom } from 'rxjs';
import { Users } from '../users/users';
import { DocUpload } from '../documents/doc-upload/doc-upload';
import { TagTree } from '../tags/tag-tree/tag-tree';
import { ConversationList } from '../ai-chat/conversation-list/conversation-list';
import { ConversationsService } from '../ai-chat/conversations.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgbDropdown, NgbDropdownToggle, 
	NgbDropdownMenu, NgbDropdownItem, TranslocoPipe, DocUpload, TagTree, ConversationList],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
	protected readonly authService = inject(Auth);
	private readonly router = inject(Router);
	protected readonly usersService = inject(Users)

  protected readonly conversationsService = inject(ConversationsService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly chatsExpanded = signal(true);
  protected readonly isCreatingChat = signal(false);
  protected readonly createChatError = signal(false);

  protected async createChat(): Promise<void> {
    if (this.isCreatingChat() || this.conversationsService.isMutating()) return;
    this.isCreatingChat.set(true);
    this.createChatError.set(false);
    try {
      const conversation = await firstValueFrom(this.conversationsService.createConversation());
      if (!this.destroyRef.destroyed) {
        this.chatsExpanded.set(true);
        await this.router.navigate(['/ai-chat', conversation.id]);
      }
    } catch {
      this.createChatError.set(true);
    } finally {
      this.isCreatingChat.set(false);
    }
  }

	async logout () {
		await firstValueFrom(this.authService.logout());
		this.usersService.currentUser.set(null);
		this.router.navigateByUrl('/login');
	}
}
