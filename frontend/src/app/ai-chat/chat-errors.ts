import { HttpErrorResponse } from '@angular/common/http';

const CHAT_ERROR_KEYS: Record<string, string> = {
  AI_SERVICE_UNAVAILABLE: 'ai-chat.error.serviceUnavailable',
  AI_REQUEST_TIMEOUT: 'ai-chat.error.timeout',
  AI_REQUEST_CANCELLED: 'ai-chat.error.cancelled',
  AI_CONVERSATION_BUSY: 'ai-chat.error.conversationBusy',
  AI_CONVERSATION_NOT_FOUND: 'ai-chat.error.conversationNotFound',
  AI_RATE_LIMITED: 'ai-chat.error.rateLimited',
  AI_CONTEXT_LIMIT: 'ai-chat.error.contextLimit',
  AI_INVALID_RESPONSE: 'ai-chat.error.invalidResponse',
  AI_GENERATION_FAILED: 'ai-chat.error.generationFailed',
  AI_SAVE_FAILED: 'ai-chat.error.saveFailed',
};

export function chatErrorKey(error: unknown): string {
  if (error instanceof Error && error.name === 'TimeoutError') return 'ai-chat.error.timeout';
  if (error instanceof HttpErrorResponse) {
    const code = error.error?.code ?? error.error?.detail?.code;
    if (typeof code === 'string' && Object.hasOwn(CHAT_ERROR_KEYS, code)) return CHAT_ERROR_KEYS[code];
    if (error.status === 0) return 'ai-chat.error.connectionLost';
    if (error.status === 503 || error.status === 502) return 'ai-chat.error.serviceUnavailable';
    if (error.status === 504) return 'ai-chat.error.timeout';
    if (error.status === 401) return 'ai-chat.error.sessionExpired';
    if (error.status === 403) return 'ai-chat.error.forbidden';
    if (error.status === 429) return 'ai-chat.error.rateLimited';
  }
  return 'ai-chat.error.ask';
}
