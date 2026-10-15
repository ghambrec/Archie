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

	readonly isDeleting = signal(false);
	readonly deleteError = signal<string | null>(null);
	
	readonly messages = signal<ChatMessage[]> ([]);

	async send(): Promise<void> {
		const conversationId = this.activeConversationId();
		
		if(this.isSending() || this.isCreatingConversation() || this.isDeleting())
			return;
		this.sendError.set(null);
		
		const question = this.draft().trim();
		if (conversationId == null) {
			this.sendError.set('ai-chat.error.createFirst')
			return;
		}
		if (!question) {
			return;
		}
		this.isSending.set(true);

		try {
    		const response = await firstValueFrom(
    		  this.conversationService.ask(conversationId, question),
    		)
		
    		const userMessage: ChatMessage = {
    			id: crypto.randomUUID(),
    		 	conv_id: conversationId,
    			sender: 'user',
    			content: question,
    			created_at: new Date().toISOString(),
    		};

		    const aiMessage: ChatMessage = {
      			id: crypto.randomUUID(),
      			conv_id: conversationId,
      			sender: 'llm',
      			content: response.answer,
      			confidence_score: response.confidence_score,
      			sources: response.sources,
      			created_at: new Date().toISOString(),
    		};			
		
    		this.messages.update((previous) => {
				const updateMessage = [
					... previous,
					userMessage,
					aiMessage,
				];
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
		if (this.isCreatingConversation() ||
			this.isSending() ||
			this.isDeleting() ) {
			return;
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

	async deleteChat(): Promise<void> {
		const conversationId = this.activeConversationId();

		if (
			!conversationId ||
			this.isDeleting() ||
			this.isSending() ||
			this.isCreatingConversation())	
			{
  			return;
			}
		this.isDeleting.set(true);
  		this.deleteError.set(null);

		  try {
		    await firstValueFrom(
		      this.conversationService.deleteConversation(conversationId)
		    );
		
		    this.activeConversationId.set(null);
		    this.messages.set([]);
		    this.draft.set('');
		    this.sendError.set(null);
		    this.createConversationError.set(null);
		  } catch {
		    this.deleteError.set('ai-chat.error.deleteConversation');
		  } finally {
		    this.isDeleting.set(false);
		  }
		}
	}
