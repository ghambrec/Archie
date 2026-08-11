import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionModule } from './session/session.module';
import { UsersModule } from '../users/users.module';
import { SessionService } from './session/session.service';
import { SessionCookieService } from './session/session-cookie.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { LoginAttemptService } from './login-attempt.service';

@Module({
  imports: [UsersModule, SessionModule],
  controllers: [AuthController],
  providers: [AuthService, SessionService, SessionCookieService, SessionAuthGuard, LoginAttemptService,],
  exports: [SessionService, SessionCookieService, SessionAuthGuard,],
})
export class AuthModule {}
