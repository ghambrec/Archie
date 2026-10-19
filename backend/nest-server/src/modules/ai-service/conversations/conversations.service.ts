import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import aiServiceConfig from 'src/config/ai-service.config';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';

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

  async renameConversation(userId: string, conversationId: string, title: string) {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/${conversationId}/`, {
        method: 'PATCH',
        headers: { ...this.headers(userId), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
    } catch {
      this.logger.error('ai-service conversation rename request failed');
      throw new ApplicationException(ErrorCode.AiServiceUnavailable);
    }

    if (response.status === 404) {
      throw new NotFoundException('Conversation not found');
    }
    if (response.status === 400 || response.status === 422) {
      throw new ApplicationException(ErrorCode.ValidationFailed);
    }
    if (!response.ok) {
      this.logger.error({ status: response.status }, 'ai-service conversation rename failed');
      throw new ApplicationException(ErrorCode.AiServiceUnavailable);
    }
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
