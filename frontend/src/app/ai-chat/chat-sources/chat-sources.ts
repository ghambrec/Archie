import { PercentPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import type { Citation } from '../chat.models';
import { groupSourceDocuments } from '../source-documents';

@Component({
  selector: 'app-chat-sources',
  imports: [PercentPipe, RouterLink, TranslocoPipe],
  templateUrl: './chat-sources.html',
})
export class ChatSources {
  readonly sources = input.required<Citation[]>();
  readonly documents = computed(() => groupSourceDocuments(this.sources()));
}
