import { registerAs } from '@nestjs/config';
import { getEnv, getEnvNumber, requireEnv } from 'src/common/env/env';

export default registerAs('aiService', () => {
  const chatTimeoutMs = getEnvNumber('AI_CHAT_TIMEOUT_MS', 190000);
  const chatRequestsPerWindow = getEnvNumber('AI_CHAT_REQUESTS_PER_WINDOW', 10);
  const chatRateWindowSeconds = getEnvNumber('AI_CHAT_RATE_WINDOW_SECONDS', 60);
  for (const [key, value] of [
    ['AI_CHAT_TIMEOUT_MS', chatTimeoutMs],
    ['AI_CHAT_REQUESTS_PER_WINDOW', chatRequestsPerWindow],
    ['AI_CHAT_RATE_WINDOW_SECONDS', chatRateWindowSeconds],
  ] as const) {
    if (value <= 0) throw new Error(`${key} must be greater than 0`);
  }
  return {
    chatTimeoutMs, chatRequestsPerWindow, chatRateWindowSeconds,
    host: getEnv('AI_SERVICE_HOST', 'ai-service'),
    port: requireEnv('AI_SERVICE_PORT'),
    apiKey: requireEnv('AI_SERVICE_API_KEY'),
  };
});
