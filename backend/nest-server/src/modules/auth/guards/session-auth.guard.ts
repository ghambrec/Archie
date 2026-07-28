import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionService } from '../session/session.service';
import { SessionCookieService } from '../session/session-cookie.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly sessionService: SessionService,
    private readonly sessionCookieService: SessionCookieService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const sessionId = this.sessionCookieService.extract(req);
    if (!sessionId) {
      throw new UnauthorizedException();
    }

    const session = await this.sessionService.get(sessionId);
    if (!session) {
      throw new UnauthorizedException();
    }

    req.userId = session.userId;
    return true;
  }
}
