import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { ConversationsService } from '../conversations.service';

@Component({
  selector: 'app-delete-all-chats-modal',
  imports: [TranslocoPipe],
  templateUrl: './delete-all-chats-modal.html',
})
export class DeleteAllChatsModal {
  protected readonly activeModal = inject(NgbActiveModal);
  private readonly conversationsService = inject(ConversationsService);
  readonly isDeleting = signal(false);
  readonly errorKey = signal<string | null>(null);

  async confirmDelete(): Promise<void> {
    if (this.isDeleting()) return;
    this.isDeleting.set(true);
    this.errorKey.set(null);
    try {
      await firstValueFrom(this.conversationsService.deleteAllConversations());
      this.activeModal.close();
    } catch {
      this.errorKey.set('ai-chat.deleteAllModal.error');
    } finally {
      this.isDeleting.set(false);
    }
  }
}
