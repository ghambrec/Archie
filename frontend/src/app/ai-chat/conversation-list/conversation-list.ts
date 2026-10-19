import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import type { Conversation } from '../chat.models';

@Component({
  selector: 'app-conversation-list',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './conversation-list.html',
})
export class ConversationList {
  readonly conversations = input.required<Conversation[]>();
  readonly isLoadingHistory = input(false);
  readonly historyError = input(false);
  readonly busy = input(false);
  readonly retry = output<void>();
}
