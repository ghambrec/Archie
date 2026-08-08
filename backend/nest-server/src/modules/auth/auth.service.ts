import { Injectable, UnauthorizedException , ConflictException} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SessionService } from './session/session.service';
import { LoginRequestDto } from './dto/login-request.dto';
import * as bcrypt from 'bcrypt';
import { LoginResult } from './interfaces/login-result.interface';
import { RegisterRequestDto } from './dto/register-request.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserSummaryDto } from '../users/dto/user-summary.dto';
import { Logger } from 'nestjs-pino';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,
    private readonly userService: UsersService,
    private readonly sessionService: SessionService,
  ) {}

  async login(request: LoginRequestDto) : Promise<LoginResult> {
    this.logger.debug('Execute login', request.email);

    const user = await this.userService.findByEmail(request.email);
    if (!user || !(await bcrypt.compare(request.password, user.passwordHash))) {
      this.logger.warn(`Login failed for ${request.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId = await this.sessionService.create(user.id);
    return { user, sessionId };
  }

  async register(request: RegisterRequestDto) : Promise<string> {
    this.logger.debug('Execute register', request.email);

    const userExists = await this.userService.findByEmail(request.email)
    if(userExists)
      throw new ConflictException(`Email ${request.email} already exists`);

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
    this.logger.debug('Execute logout', sessionId);

    return this.sessionService.destroy(sessionId);
  }

  async getCurrentUser(userId: string) : Promise<UserSummaryDto> {
    this.logger.debug('Execute getCurrentUser', userId);
    return this.userService.findProfileById(userId);
  }
}
