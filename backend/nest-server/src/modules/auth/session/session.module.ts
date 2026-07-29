import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionCookieService } from './session-cookie.service';
import { SessionAuthGuard } from '../guards/session-auth.guard';

@Module({
  providers: [SessionService, SessionCookieService, SessionAuthGuard],
  exports: [SessionService, SessionCookieService, SessionAuthGuard],
})
export class SessionModule {}
