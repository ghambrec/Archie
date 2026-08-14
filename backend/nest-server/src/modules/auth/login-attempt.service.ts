import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { ConfigService } from '@nestjs/config';


const failKey = (email: string) => `login:fail:${email}`;
const lockKey = (email: string) => `login:lock:${email}`;

@Injectable()
export class LoginAttemptService {
  private readonly maxAttempts: number;
  private readonly lockoutSeconds: number;
  constructor(
    
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,  
    private readonly configService: ConfigService) {
      this.maxAttempts = this.configService.getOrThrow<number>(
        'auth.maxLoginAttempts',
      );
      this.lockoutSeconds = this.configService.getOrThrow<number>(
        'auth.loginLockoutSeconds',
      )
    }

  async isLocked(email: string): Promise<number | null> {
    const ttl = await this.redis.ttl(lockKey(email));
    return ttl > 0 ? ttl : null;
  }

  async registerFailure(email: string): Promise<void> {
    const attempts = await this.redis.incr(failKey(email));
    if (attempts === 1) {
      await this.redis.expire(failKey(email), this.lockoutSeconds);
    }

    if (attempts >= this.maxAttempts) {
      await this.redis
        .multi()
        .set(lockKey(email), '1', 'EX', this.lockoutSeconds)
        .del(failKey(email))
        .exec();
    }
  }

  async clearAttempts(email: string): Promise<void> {
    await this.redis.del(failKey(email), lockKey(email));
  }
}
