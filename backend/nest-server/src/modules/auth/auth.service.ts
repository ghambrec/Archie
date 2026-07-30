import { Injectable, UnauthorizedException , ConflictException} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SessionService } from './session/session.service';
import { LoginRequestDto } from './dto/login-request.dto';
import * as bcrypt from 'bcrypt';
import { LoginResult } from './interfaces/login-result.interface';
import { RegisterRequestDto } from './dto/register-request.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly sessionService: SessionService,
  ) {}
  
  async login(request: LoginRequestDto) : Promise<LoginResult> {
    const user = await this.userService.findByEmail(request.email);
    if (!user || !(await bcrypt.compare(request.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId = await this.sessionService.create(user.id);
    return { user, sessionId };
  }
  
  async register(request: RegisterRequestDto) : Promise<string> {
    
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

    return this.sessionService.destroy(sessionId);
  }
}
