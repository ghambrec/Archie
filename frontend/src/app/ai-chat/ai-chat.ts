import { Component, inject, signal, OnInit} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChatMessage, Conversation } from './chat.models';
import { ConversationsService } from './conversations.service';
import { firstValueFrom } from 'rxjs';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ConversationList } from './conversation-list/conversation-list';


@Component({
	selector: 'app-ai-chat',
	imports: [TranslocoPipe, NgbTooltip, ConversationList],
	templateUrl: './ai-chat.html',
})
export class AIChat implements OnInit {
	readonly draft = signal('');
	private readonly conversationService = inject (ConversationsService);

	readonly activeConversationId = signal<string | null>(null);
	readonly isCreatingConversation = signal(false);
	readonly createConversationError = signal<string | null>(null);

	readonly conversations = signal<Conversation[]>([]);
	readonly isLoadingHistory = signal(false);
	readonly historyError = signal<string | null>(null);

	readonly isSending = signal(false);
	readonly sendError = signal<string | null>(null);

	readonly isDeleting = signal(false);
	readonly deleteError = signal<string | null>(null);

	readonly isOpeningConversation = signal(false);
	readonly openConversationError = signal<string | null>(null);
	
	readonly messages = signal<ChatMessage[]> ([]);

	ngOnInit(): void {
		void this.loadConversations();
	}
	async loadConversations(): Promise<void> {
 		 if (this.isLoadingHistory()) {
 		   return;
 		 }
	 
 		 this.isLoadingHistory.set(true);
 		 this.historyError.set(null);
	 
 		 try {
 		   const response = await firstValueFrom(
 		     this.conversationService.getConversations()
 		   );
	   
 		   this.conversations.set(response.data);
 		 } catch {
 		   this.historyError.set('ai-chat.history.loadError');
 		 } finally {
 		   this.isLoadingHistory.set(false);
 		 }
}

	async send(): Promise<void> {
		if(
			this.isSending() || 
			this.isCreatingConversation() ||
			this.isOpeningConversation() ||
			this.isDeleting())
			return;

		
		const question = this.draft().trim();
		if (!question) {
			return;
		}
		this.sendError.set(null);
		this.isSending.set(true);

		let conversationId = this.activeConversationId();

		try {
			if (!conversationId) {
     			const conversation = await firstValueFrom(
     			  this.conversationService.createConversation()
     			);

				conversationId = conversation.id;
      			this.activeConversationId.set(conversationId);
      			this.messages.set([]);

				await this.loadConversations();
    		}

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
			this.isDeleting() ||
			this.isOpeningConversation() ) {
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

	async openConversation(conversationID: string): Promise<void> {
		if (
			this.isOpeningConversation() ||
			this.isSending() ||
			this.isCreatingConversation() ||
			this.isDeleting()
		) {
			return;
		}
		try {
			const response = await firstValueFrom(
				this.conversationService.getMessages(conversationID)
			);

			this.messages.set(response.data);
			this.activeConversationId.set(conversationID);

			this.sendError.set(null);
			this.deleteError.set(null);
			this.createConversationError.set(null);

		} catch {
			this.openConversationError.set('ai-chat.history.openError');
		} finally {
		    this.isOpeningConversation.set(false);
		  }

	}
}

