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



	send(): void {

		const text = this.draft().trim();

		
		if(!text){
			return;
		}
		
		const newMessage: ChatMessage ={
			id: 'bbf88732-382c-4c9c-8b4d-276e9ac8309e',
			conv_id: '0c3ce122-7dd7-4f14-96b4-523f3c32418b',
			sender: 'user',
			content: text,
			created_at: new Date().toString(),

		};
		this.messages.update((previous) => {
			const updateMessages = [...previous,newMessage];
			return updateMessages;
		})
		this.draft.set('');

	}
	async startNewChat(): Promise<void> {
		if (this.isCreatingConversation()) {
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