import { Component, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ChatMessage } from './chat.models';

@Component({
	selector: 'app-ai-chat',
	imports: [TranslocoPipe],
	templateUrl: './ai-chat.html',
})
export class AIChat {
	readonly draft = signal('');

	readonly messages = signal<ChatMessage[]> ([
		{
			id: 'demo-message',
			conv_id: 'demo',
			sender: 'user',
			content: 'Hallo! ich bin eine demooooooooooooooooooooooo frage',
			created_at: new Date().toString(),

		},

		{
			id: 'demo-message',
			conv_id: 'demo',
			sender: 'llm',
			content: 'Hallo! ich bin eine demo antworttttttttttttttttttttttttttttttttttttt',
			created_at: new Date().toString(),

		},
		
		{
			id: 'demo-message',
			conv_id: 'demo',
			sender: 'user',
			content: 'Hallo! ich bin eine demo frage',
			created_at: new Date().toString(),

		},

		{
			id: 'demo-message',
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

	}
}