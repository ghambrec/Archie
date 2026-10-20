import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { ConversationList } from '../conversation-list/conversation-list';
import { ConversationsService } from '../conversations.service';

@Component({
  selector: 'app-chat-sidebar',
  imports: [TranslocoPipe, ConversationList],
  templateUrl: './chat-sidebar.html',
  styleUrl: './chat-sidebar.scss',
  host: {
    '[class.collapsed]': '!chatsExpanded()',
    'role': 'region',
    'aria-labelledby': 'chats-heading',
  },
})
export class ChatSidebar {
  private readonly router = inject(Router);
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
}
