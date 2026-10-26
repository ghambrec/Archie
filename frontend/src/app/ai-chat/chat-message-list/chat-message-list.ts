import { afterRenderEffect, Component, ElementRef, input, viewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import type { ChatMessage } from '../chat.models';
import { ChatMessage as ChatMessageComponent } from '../chat-message/chat-message';

@Component({
  selector: 'app-chat-message-list',
  imports: [TranslocoPipe, ChatMessageComponent],
  templateUrl: './chat-message-list.html',
  styleUrl: './chat-message-list.scss',
})
export class ChatMessageList {
  readonly messages = input.required<ChatMessage[]>();
  readonly conversationId = input<string | null>(null);
  readonly isSending = input(false);
  readonly isLoading = input(false);
  readonly errorKey = input<string | null>(null);

  private readonly messageViewport = viewChild<ElementRef<HTMLDivElement>>('messageViewport');
  private followLatestMessages = true;
  private lastScrollConversationId: string | null | undefined;
  private lastRenderedMessageId: string | undefined;

  constructor() {
    afterRenderEffect(() => {
      const viewport = this.messageViewport()?.nativeElement;
      const conversationId = this.conversationId();
      const latestMessageId = this.messages().at(-1)?.id;
      if (conversationId !== this.lastScrollConversationId) {
        this.lastScrollConversationId = conversationId;
        this.lastRenderedMessageId = undefined;
        this.followLatestMessages = true;
      }
      if (!viewport || !latestMessageId || latestMessageId === this.lastRenderedMessageId) return;
      this.lastRenderedMessageId = latestMessageId;
      if (this.followLatestMessages) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    });
  }

  protected onMessagesScroll(): void {
    const viewport = this.messageViewport()?.nativeElement;
    if (!viewport) return;
    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    this.followLatestMessages = distanceFromBottom <= 80;
  }
}
