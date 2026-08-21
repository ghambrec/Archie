import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SessionService } from './session/session.service';
import { LoginRequestDto } from './dto/login-request.dto';
import * as bcrypt from 'bcrypt';
import { LoginResult } from './interfaces/login-result.interface';
import { RegisterRequestDto } from './dto/register-request.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserSummaryDto } from '../users/dto/user-summary.dto';
import { Logger } from 'nestjs-pino';
import { LoginAttemptService } from './login-attempt.service';
import { LockedException } from './exceptions/locked.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,
    private readonly userService: UsersService,
    private readonly sessionService: SessionService,
    private readonly loginAttemptService: LoginAttemptService,
  ) {}

  async login(request: LoginRequestDto) : Promise<LoginResult> {
    this.logger.log('Execute login', request.email);

    const retryAfterSeconds = await this.loginAttemptService.isLocked(request.email);
    if (retryAfterSeconds !== null) {
      this.logger.warn(`Login blocked for ${request.email}, locked out`);
      throw new LockedException(retryAfterSeconds);
    }

    const user = await this.userService.findByEmail(request.email);
    if (!user || !(await bcrypt.compare(request.password, user.passwordHash))) {
      await this.loginAttemptService.registerFailure(request.email);
      this.logger.warn(`Login failed for ${request.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.loginAttemptService.clearAttempts(request.email);
    const sessionId = await this.sessionService.create(user.id);
    return { user, sessionId };
  }

  async register(request: RegisterRequestDto) : Promise<string> {
    this.logger.log('Execute register', request.email);

    const createUserDto: CreateUserDto = {
      email: request.email,
      password: request.password,
      displayName: request.displayName,
    }

    const user = await this.userService.create(createUserDto);

    const sessionId = await this.sessionService.create(user.id);
    return sessionId;
  }

  async logout(sessionId: string) : Promise<void> {
    this.logger.log('Execute logout', sessionId);

    return this.sessionService.destroy(sessionId);
  }

  async getCurrentUser(userId: string) : Promise<UserSummaryDto> {
    this.logger.log('Execute getCurrentUser', userId);
    return this.userService.findProfileById(userId);
  }
}
