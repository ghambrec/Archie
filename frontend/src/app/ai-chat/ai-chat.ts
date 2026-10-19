import { Component, computed, inject, signal} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ConversationsService } from './conversations.service';
import { firstValueFrom } from 'rxjs';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ConversationList } from './conversation-list/conversation-list';


@Component({
	selector: 'app-ai-chat',
	imports: [TranslocoPipe, NgbTooltip, ConversationList],
	templateUrl: './ai-chat.html',
})
export class AIChat {
	readonly draft = signal('');
	private readonly conversationService = inject (ConversationsService);

	readonly activeConversationId = signal<string | null>(null);
	readonly isCreatingConversation = signal(false);
	readonly createConversationError = signal<string | null>(null);

	readonly conversationsResource = this.conversationService.conversationsResource();
	readonly conversations = computed(() => {
		if (this.conversationsResource.hasValue()) {
			return this.conversationsResource.value().data;
		}
		return [];
	});
	readonly isLoadingHistory = this.conversationsResource.isLoading;
	readonly historyError = computed(() => {
		if (this.conversationsResource.error()) {
			return 'ai-chat.history.loadError';
		}
		return null;
	});

	readonly isSending = signal(false);
	readonly sendError = signal<string | null>(null);

	readonly isDeleting = signal(false);
	readonly deleteError = signal<string | null>(null);

	readonly messageResource = 
		this.conversationService.messageResource(this.activeConversationId)
	readonly messages = computed(() => {
		if (this.messageResource.hasValue()){
			return this.messageResource.value().data
		} else {
			return []
		}
		});
	readonly isOpeningConversation = this.messageResource.isLoading;

	readonly openConversationError = computed(() => {
		if(this.messageResource.error())
			return 'ai-chat.history.openError'
		else{
			return null
		}
	});

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

				this.conversationsResource.reload();
    		}

			await firstValueFrom(
				this.conversationService.ask(conversationId, question)
			);
			this.messageResource.reload();
			this.conversationsResource.reload();

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
			this.conversationsResource.reload();
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
		    this.conversationsResource.reload();
		    this.draft.set('');
		    this.sendError.set(null);
		    this.createConversationError.set(null);
		  } catch {
		    this.deleteError.set('ai-chat.error.deleteConversation');
		  } finally {
		    this.isDeleting.set(false);
		  }
		}

	openConversation(conversationID: string): void {
		if (
			this.isOpeningConversation() ||
			this.isSending() ||
			this.isCreatingConversation() ||
			this.isDeleting()
		) {
			return;
		}
		this.sendError.set(null);
		this.deleteError.set(null);
		this.createConversationError.set(null);
		this.activeConversationId.set(conversationID);

	}
}

