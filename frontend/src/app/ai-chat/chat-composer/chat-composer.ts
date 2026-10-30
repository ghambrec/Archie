import { Component, input, model, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-chat-composer',
  imports: [TranslocoPipe],
  templateUrl: './chat-composer.html',
  styles: [':host { display: block; flex-shrink: 0; }'],
})
export class ChatComposer {
  readonly draft = model('');
  readonly busy = input(false);
  readonly canDeleteChat = input(false);
  readonly canDeleteAll = input(false);
  readonly sendError = input<string | null>(null);
  readonly sendRequested = output<void>();
  readonly deleteRequested = output<void>();
  readonly deleteAllRequested = output<void>();
}
