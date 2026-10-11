import { Inject, Injectable, Post } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import aiServiceConfig from 'src/config/ai-service.config';

@Injectable()
export class ConversationsService {
	private readonly baseUrl: string;

	constructor (
		@Inject(aiServiceConfig.KEY)
		private readonly config: ConfigType<typeof aiServiceConfig>,
		private readonly logger: Logger
	) {
		this.baseUrl = `http://${this.config.host}:${this.config.port}/conversations`
	}

	private headers(userId: string): HeadersInit {
		return { 'X-API-KEY': this.config.apiKey, 'X-User-Id': userId };
	}

	async createConversation(userId: string) {
		const url = this.baseUrl;
		const response = await fetch(url, {
			method: 'POST', 
			headers: this.headers(userId) 
		});
		if (!response.ok)
			throw new Error('ai-service request failed');
		return response.json();
	}

	async getConversations(userId: string) {
		const url = this.baseUrl;
		const response = await fetch(url, {
			headers: this.headers(userId)
		});
		if (!response.ok)
			throw new Error('ai-service request failed');
		return response.json();
	}

	async ask(userId: string, conversationId: string, question: string) {
		const url = `${this.baseUrl}/${conversationId}/ask`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {...this.headers(userId), 'Content-Type': 'application/json'},
			body: JSON.stringify({question}),
		})
		if (!response.ok)
			throw new Error('ai-service request failed');
		return response.json();
	}

	async getMessages(userId: string, conversationId: string) {
		const url = `${this.baseUrl}/${conversationId}/messages`;
		const response = await fetch(url, {
			headers: this.headers(userId)
		})
		if (!response.ok)
			throw new Error('ai-service request failed');
		return response.json();
	}

	async deleteConversation(userId: string, conversationId: string) {
		const url = `${this.baseUrl}/${conversationId}`;
		const response = await fetch(url, {
			method: 'DELETE',
			headers: this.headers(userId)
		})
		if (!response.ok)
			throw new Error('ai-service request failed');
	}

	async deleteAllConversations(userId: string)  {
		const url = `${this.baseUrl}`;
		const response = await fetch(url, {
			method: 'DELETE',
			headers: this.headers(userId)
		})
		if (!response.ok)
				throw new Error('ai-service request failed')
	}
}
