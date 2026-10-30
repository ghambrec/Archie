import { Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import type { Conversation } from '../chat.models';
import { ConversationsService } from '../conversations.service';

@Component({
  selector: 'app-rename-chat-modal',
  imports: [TranslocoPipe],
  templateUrl: './rename-chat-modal.html',
})
export class RenameChatModal {
  private selectedChat!: Conversation;
  protected readonly activeModal = inject(NgbActiveModal);
  private readonly conversationsService = inject(ConversationsService);
  readonly title = signal('');
  readonly touched = signal(false);
  readonly isSaving = signal(false);
  readonly errorKey = signal<string | null>(null);
  readonly maxTitleLength = 254;
  readonly validationError = computed(() => {
    const title = this.title().trim();
    if (!title) return 'ai-chat.renameModal.required';
    if (Array.from(title).length > this.maxTitleLength) return 'ai-chat.renameModal.tooLong';
    return null;
  });

  initialize(conversation: Conversation): void {
    this.selectedChat = conversation;
    this.title.set(conversation.title ?? '');
  }

  async save(): Promise<void> {
    if (this.isSaving()) return;
    this.touched.set(true);
    this.errorKey.set(null);
    if (this.validationError()) return;
    const title = this.title().trim();
    if (title === (this.selectedChat.title ?? '').trim()) {
      this.activeModal.close();
      return;
    }

    this.isSaving.set(true);
    try {
      await firstValueFrom(this.conversationsService.renameConversation(this.selectedChat.id, title));
      this.activeModal.close();
    } catch {
      this.errorKey.set('ai-chat.renameModal.saveError');
    } finally {
      this.isSaving.set(false);
    }
  }
}
