import { registerAs } from '@nestjs/config';
import { requireEnv } from 'src/common/env/env';
import { getEnv } from 'src/common/env/env';

export default registerAs('aiService', () => {
  return {
    host: getEnv('AI_SERVICE_HOST', 'ai-service'),
    port: requireEnv('AI_SERVICE_PORT'),
    apiKey: requireEnv('AI_SERVICE_API_KEY'),
  };
});
