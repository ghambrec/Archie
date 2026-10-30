import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from './application.exception';
import { ErrorCode } from './error-code';

const AI_ERROR_CODES: ReadonlySet<string> = new Set(
  Object.values(ErrorCode).filter(code => code.startsWith('AI_')),
);

const FALLBACK_CODES: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.GATEWAY_TIMEOUT]: ErrorCode.AiRequestTimeout,
  [HttpStatus.NOT_FOUND]: ErrorCode.AiConversationNotFound,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.AiRateLimited,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.ValidationFailed,
};

/** Translate Python errors into the existing public application error contract. */
export async function mapAiServiceError(response: Response): Promise<ApplicationException> {
  const payload = await response.json().catch(() => null);
  const detail = payload?.detail ?? payload;
  const code = typeof detail?.code === 'string' && AI_ERROR_CODES.has(detail.code)
    ? detail.code as ErrorCode
    : FALLBACK_CODES[response.status] ?? ErrorCode.AiServiceUnavailable;

  const rawRetry = detail?.retryAfterSeconds ?? response.headers.get('retry-after');
  const retry = rawRetry == null ? undefined : Number(rawRetry);
  const retryAfterSeconds = Number.isFinite(retry) && retry! >= 0 ? Math.ceil(retry!) : undefined;

  return new ApplicationException(code, retryAfterSeconds);
}
