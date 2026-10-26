import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import type { Conversation } from '../chat.models';
import { ConversationsService } from '../conversations.service';

@Component({
  selector: 'app-delete-chat-modal',
  imports: [TranslocoPipe],
  templateUrl: './delete-chat-modal.html',
})
export class DeleteChatModal {
  selectedChat!: Pick<Conversation, 'id' | 'title'>;
  protected readonly activeModal = inject(NgbActiveModal);
  private readonly conversationsService = inject(ConversationsService);
  readonly isDeleting = signal(false);
  readonly errorKey = signal<string | null>(null);

  async confirmDelete(): Promise<void> {
    if (this.isDeleting()) return;
    this.isDeleting.set(true);
    this.errorKey.set(null);
    try {
      await firstValueFrom(this.conversationsService.deleteConversation(this.selectedChat.id));
      this.activeModal.close(this.selectedChat.id);
    } catch {
      this.errorKey.set('ai-chat.error.deleteConversation');
    } finally {
      this.isDeleting.set(false);
    }
  }
}
