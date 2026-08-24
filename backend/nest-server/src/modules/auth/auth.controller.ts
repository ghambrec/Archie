import { Body, Controller, Get, Post, Req, Res, Session, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { SessionCookieService } from './session/session-cookie.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { UserSummaryDto } from '../users/dto/user-summary.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionCookieService: SessionCookieService,
  ) {}

  @ApiOperation({
    summary: 'Log in',
    description:
      'Authenticates a user with email and password, starts a new session, and sets the session cookie on the response.',
  })
  @Post('login')
  async login(
    @Body() loginRequest: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { user, sessionId } = await this.authService.login(loginRequest);

    this.sessionCookieService.set(res, sessionId);

    return { id: user.id, email: user.email, displayName: user.displayName };
  }

  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account, starts a session for it, and sets the session cookie on the response.',
  })
  @Post('register')
  async register(
    @Body() registerRequest: RegisterRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const sessionId  = await this.authService.register(registerRequest);

    this.sessionCookieService.set(res, sessionId);
  }

  @ApiOperation({
    summary: 'Log out',
    description: 'Invalidates the current session and clears the session cookie.',
  })
  @UseGuards(SessionAuthGuard)
  @Get('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const sessionId = this.sessionCookieService.extract(req)!;
    await this.authService.logout(sessionId);
    this.sessionCookieService.clear(res);
  }

  @ApiOperation({
    summary: 'Get the current user',
    description: 'Returns the profile of the user associated with the active session.',
  })
  @UseGuards(SessionAuthGuard)
  @Get('me')
  async me(@Req() req: Request): Promise<UserSummaryDto> {
    return this.authService.getCurrentUser(req.userId!);
  }
}
