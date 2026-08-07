import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { requireEnv } from 'src/common/env/env';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        return new Redis(requireEnv('REDIS_URL'));
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
