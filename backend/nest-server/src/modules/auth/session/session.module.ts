import { Module, forwardRef } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionCookieService } from './session-cookie.service';
import { SessionAuthGuard } from '../guards/session-auth.guard';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [SessionService, SessionCookieService, SessionAuthGuard],
  exports: [SessionService, SessionCookieService, SessionAuthGuard],
})
export class SessionModule {}
