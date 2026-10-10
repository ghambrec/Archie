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
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly sessionService: SessionService,
    private readonly sessionCookieService: SessionCookieService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    const user = await this.userRepository.findOneBy({ id: session.userId });
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
