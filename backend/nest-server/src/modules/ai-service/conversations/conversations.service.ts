import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import aiServiceConfig from 'src/config/ai-service.config';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';
import { mapAiServiceError } from 'src/common/errors/ai-service-error.mapper';

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

  private async request(userId: string, path: string, init: RequestInit = {}, signal?: AbortSignal) {
    if (signal?.aborted) throw new ApplicationException(ErrorCode.AiRequestCancelled);
    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(), this.config.chatTimeoutMs);
    const requestSignal = signal ? AbortSignal.any([signal, deadline.signal]) : deadline.signal;
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { ...this.headers(userId), 'Content-Type': 'application/json' },
        signal: requestSignal,
      });
      if (!response.ok) throw await mapAiServiceError(response);
      const text = await response.text();
      try { return JSON.parse(text); }
      catch { throw new ApplicationException(ErrorCode.AiInvalidResponse); }
    } catch (error) {
      if (signal?.aborted) throw new ApplicationException(ErrorCode.AiRequestCancelled);
      if (deadline.signal.aborted) throw new ApplicationException(ErrorCode.AiRequestTimeout);
      if (error instanceof ApplicationException) throw error;
      this.logger.warn({ path }, 'AI service conversation request failed');
      throw new ApplicationException(ErrorCode.AiServiceUnavailable);
    } finally {
      clearTimeout(timer);
    }
  }

  createConversation(userId: string) {
    return this.request(userId, '', { method: 'POST' });
  }

  getConversations(userId: string) {
    return this.request(userId, '');
  }

  ask(userId: string, conversationId: string, question: string, signal?: AbortSignal) {
    return this.request(userId, `/${conversationId}/ask`, {
      method: 'POST', body: JSON.stringify({ question }),
    }, signal);
  }

  getMessages(userId: string, conversationId: string) {
    return this.request(userId, `/${conversationId}/messages`);
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
