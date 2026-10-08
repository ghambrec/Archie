import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionService } from '../session/session.service';
import { SessionCookieService } from '../session/session-cookie.service';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly sessionService: SessionService,
    private readonly sessionCookieService: SessionCookieService,
    private readonly userService: UsersService,
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

    // forcing to change password
    const user = await this.userService.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const method = req.method.toUpperCase();
    const path = req.path;

    const isPasswordPatch = method === 'PATCH' && path === '/users/me/password';
    const isLogout = method === 'GET' && path === '/auth/logout';
    const isGetMe = method === 'GET' && path === '/users/me';

    if (user.lastLoginAt === null && !isPasswordPatch && !isLogout && !isGetMe) {
      throw new ForbiddenException('PASSWORD_CHANGE_REQUIRED');
    }
    return true;
  }
}
