import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60;

const failKey = (email: string) => `login:fail:${email}`;
const lockKey = (email: string) => `login:lock:${email}`;

@Injectable()
export class LoginAttemptService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async isLocked(email: string): Promise<number | null> {
    const ttl = await this.redis.ttl(lockKey(email));
    return ttl > 0 ? ttl : null;
  }

  async registerFailure(email: string): Promise<void> {
    const attempts = await this.redis.incr(failKey(email));
    if (attempts === 1) {
      await this.redis.expire(failKey(email), LOCKOUT_SECONDS);
    }

    if (attempts >= MAX_ATTEMPTS) {
      await this.redis
        .multi()
        .set(lockKey(email), '1', 'EX', LOCKOUT_SECONDS)
        .del(failKey(email))
        .exec();
    }
  }

  async clearAttempts(email: string): Promise<void> {
    await this.redis.del(failKey(email), lockKey(email));
  }
}
