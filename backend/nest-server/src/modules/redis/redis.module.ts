import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from 'src/config/redis.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports:[
    ConfigModule.forFeature(redisConfig)
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [
        redisConfig.KEY
      ],
      useFactory: (
        config: ConfigType<typeof redisConfig>
      ) => {
        return new Redis(config.redisURL);
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
