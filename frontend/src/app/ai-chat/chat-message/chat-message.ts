import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import type { ChatMessage as ChatMessageData } from '../chat.models';
import { ChatSources } from '../chat-sources/chat-sources';

@Component({
  selector: 'app-chat-message',
  imports: [TranslocoPipe, ChatSources],
  templateUrl: './chat-message.html',
  styles: [':host { display: block; }'],
})
export class ChatMessage {
  readonly message = input.required<ChatMessageData>();
}
