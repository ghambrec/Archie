import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const url = process.env.REDIS_URL;
        if (!url) {
          throw new Error('REDIS_URL environment variable is not set');
        }
        return new Redis(url);
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
