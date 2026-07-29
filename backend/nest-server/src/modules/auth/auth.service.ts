import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SessionService } from './session/session.service';
import { LoginRequestDto } from './dto/login-request.dto';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginResult } from './interfaces/login-result.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly sessionService: SessionService,
  ) {}
  
  async login(request: LoginRequestDto) : Promise<LoginResult> {
    const user = await this.userService.findByEmail(request.email); // you'll need to add this
    if (!user || !(await bcrypt.compare(request.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId = await this.sessionService.create(user.id);
    return { user, sessionId };
  }
  
}
