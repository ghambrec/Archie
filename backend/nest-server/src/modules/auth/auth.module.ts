import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session/session.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionService]
})
export class AuthModule {}
