import { Module, forwardRef } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionCookieService } from './session-cookie.service';
import { SessionAuthGuard } from '../guards/session-auth.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';

const userRepositoryModule = TypeOrmModule.forFeature([User]);

@Module({
  imports: [userRepositoryModule],
  providers: [SessionService, SessionCookieService, SessionAuthGuard],
  exports: [SessionService, SessionCookieService, SessionAuthGuard, userRepositoryModule],
})
export class SessionModule {}
