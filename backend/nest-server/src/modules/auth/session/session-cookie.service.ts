import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

const SESSION_COOKIE_NAME = 'session_id';
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

@Injectable()
export class SessionCookieService {
  private readonly cookieName: string;
  private readonly ttlSeconds: number;

  constructor() {
    this.cookieName = SESSION_COOKIE_NAME;
    this.ttlSeconds = process.env.SESSION_TTL_SECONDS
      ? Number(process.env.SESSION_TTL_SECONDS)
      : DEFAULT_SESSION_TTL_SECONDS;
  }

  set(res: Response, sessionId: string): void {
    res.cookie(this.cookieName, sessionId, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.ttlSeconds * 1000,
    });
  }

  clear(res: Response): void {
    res.clearCookie(this.cookieName);
  }

  extract(req: Request): string | undefined {
    return req.cookies?.[this.cookieName];
  }
}
