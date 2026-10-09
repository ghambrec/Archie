import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChatMessage } from './chat.models';
import { ConversationsService } from './conversations.service';
import { firstValueFrom } from 'rxjs';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-ai-chat',
	imports: [TranslocoPipe, NgbTooltip],
	templateUrl: './ai-chat.html',
})
export class AIChat {
	readonly draft = signal('');
	private readonly conversationService = inject (ConversationsService);

	readonly activeConversationId = signal<string | null>(null);
	readonly isCreatingConversation = signal(false);
	readonly createConversationError = signal<string | null>(null);

	readonly isSending = signal(false);
	readonly sendError = signal<string | null>(null);
	
	readonly messages = signal<ChatMessage[]> ([
		
		{
			id: 'demo-message0',
			conv_id: 'demo',
			sender: 'user',
			content: 'Hallo! ich bin eine demooooooooooooooooooooooo frage',
			created_at: new Date().toString(),

		},

		{
			id: 'demo-message1',
			conv_id: 'demo',
			sender: 'llm',
			content: 'Hallo! ich bin eine demo antworttttttttttttttttttttttttttttttttttttt',
			created_at: new Date().toString(),

		},
		
		{
			id: 'demo-message2',
			conv_id: 'demo',
			sender: 'user',
			content: 'Hallo! ich bin eine demo frage',
			created_at: new Date().toString(),

		},

		{
			id: 'demo-message8',
			conv_id: 'demo',
			sender: 'llm',
			content: 'Hallo! ich bin eine demo antwort',
			created_at: new Date().toString(),

		}, 

		{
			id: 'demo-message3',
			conv_id: 'demo',
			sender: 'user',
			content: 'Hallo! ich bin eine demo frage',
			created_at: new Date().toString(),

		},

		{
			id: 'demo-message4',
			conv_id: 'demo',
			sender: 'llm',
			content: 'Hallo! ich bin eine demo antwort',
			created_at: new Date().toString(),

		}
		
	])

	async send(): Promise<void> {
		const question = this.draft().trim();
		const conversationId = this.activeConversationId();

		if(this.isSending() || this.isCreatingConversation())
			return;
		this.sendError.set(null);

		if (conversationId == null) {
			this.sendError.set('ai-chat.error.createFirst')
			return;
		}
		if (question == null) {
			return;
		}

		try {
    		const response = await firstValueFrom(
    		  this.conversationService.ask(conversationId, question),
    		)
		
    		const userMessage: ChatMessage = {
    			id: 'demo-message2',
    		 	conv_id: conversationId,
    			sender: 'user',
    			content: question,
    			created_at: new Date().toISOString(),
    		};
		
    		this.messages.update((previous) => {
				const updateMessage = [... previous, userMessage];
				return updateMessage 
			});

		
    		this.draft.set('');
  		} catch {
    		this.sendError.set(
    		  'ai-chat.error.ask',
    		);
  		} finally {
    		this.isSending.set(false);
  		}		
	}		



	async startNewChat(): Promise<void> {
		if (this.isCreatingConversation() || this.isSending()) {
			return 
		}
		this.isCreatingConversation.set(true);
		this.createConversationError.set(null);

		try{
			const response = await firstValueFrom(
				this.conversationService.createConversation());
		
			this.activeConversationId.set(response.id);
			this.messages.set([]);
			this.draft.set('');
			}

		catch {
			this.createConversationError.set('ai-chat.error.createConversation');
			
		}

		finally {
			this.isCreatingConversation.set(false);
		}
	}
}