import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import type { ChatMessage as ChatMessageData } from '../chat.models';
import { ChatSources } from '../chat-sources/chat-sources';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-chat-message',
  imports: [TranslocoPipe, ChatSources, MarkdownComponent],
  templateUrl: './chat-message.html',
  styleUrl: './chat-message.scss',
})
export class ChatMessage {
  readonly message = input.required<ChatMessageData>();
}
