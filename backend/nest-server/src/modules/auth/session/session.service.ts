import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { SessionPayload } from '../interfaces/session-payload.interface';

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const sessionKey = (sessionId: string) => `session:${sessionId}`;
const userSessionsKey = (userId: string) => `user:${userId}:sessions`;

@Injectable()
export class SessionService {
  private readonly ttlSeconds: number;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.ttlSeconds = process.env.SESSION_TTL_SECONDS
      ? Number(process.env.SESSION_TTL_SECONDS)
      : DEFAULT_SESSION_TTL_SECONDS;
  }

  async create(userId: string): Promise<string> {
    const sessionId = randomUUID();
    const payload: SessionPayload = {
      userId,
      createdAt: new Date().toISOString(),
    };

    // TODO: Read more about this sadd..
    await this.redis
      .multi()
      .set(sessionKey(sessionId), JSON.stringify(payload), 'EX', this.ttlSeconds)
      .sadd(userSessionsKey(userId), sessionId)
      .exec();

    return sessionId;
  }

  async get(sessionId: string): Promise<SessionPayload | null> {
    const raw = await this.redis.get(sessionKey(sessionId));
    return raw ? (JSON.parse(raw) as SessionPayload) : null;
  }

  async destroy(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    await this.redis.del(sessionKey(sessionId));

    if (session) {
      await this.redis.srem(userSessionsKey(session.userId), sessionId);
    }
  }

  async destroyAllForUser(userId: string): Promise<void> {
    const sessionIds = await this.redis.smembers(userSessionsKey(userId));
    if (sessionIds.length === 0) {
      return;
    }

    await this.redis
      .multi()
      .del(sessionIds.map(sessionKey))
      .del(userSessionsKey(userId))
      .exec();
  }
}
