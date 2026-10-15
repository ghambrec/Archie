import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import type { Conversation } from '../chat.models';

@Component({
  selector: 'app-conversation-list',
  imports: [DatePipe, TranslocoPipe],
  templateUrl: './conversation-list.html',
})
export class ConversationList {
  readonly conversations = input.required<Conversation[]>();
  readonly activeConversationId = input<string | null>(null);
  readonly isLoadingHistory = input(false);
  readonly historyError = input<string | null>(null);
}
