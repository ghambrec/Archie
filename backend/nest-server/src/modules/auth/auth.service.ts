import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SessionService } from './session/session.service';
import { LoginRequestDto } from './dto/login-request.dto';
import * as bcrypt from 'bcrypt';
import { LoginResult } from './interfaces/login-result.interface';
import { RegisterRequestDto } from './dto/register-request.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Logger } from 'nestjs-pino';
import { LoginAttemptService } from './login-attempt.service';
import { LockedException } from './exceptions/locked.exception';
import { UserSummaryDto } from '../users/dto/user-summary.dto';
import { SessionCookieService } from './session/session-cookie.service';
import type { Request } from 'express';

@Injectable()
export class AuthService {
	constructor(
		private readonly logger: Logger,
		private readonly userService: UsersService,
		private readonly sessionService: SessionService,
		private readonly loginAttemptService: LoginAttemptService,
		private readonly sessionCookieService: SessionCookieService
	) { }

	async login(request: LoginRequestDto): Promise<LoginResult> {
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
		
		const hasToChangePassword = user.mustChangePassword;

		const sessionId = await this.sessionService.create(user.id);
		try {
			await this.userService.recordSuccessfulLogin(user.id, new Date());
		} catch (error) {
			await this.sessionService.destroy(sessionId);
			throw error;
		}
		return { user, sessionId, hasToChangePassword };
	}

	async register(request: RegisterRequestDto): Promise<string> {
		this.logger.log('Execute register', request.email);

		const createUserDto: CreateUserDto = {
			email: request.email,
			password: request.password,
			displayName: request.displayName,
		}

		const user = await this.userService.create(createUserDto, false);

		const sessionId = await this.sessionService.create(user.id);
		return sessionId;
	}

	async logout(sessionId: string): Promise<void> {
		this.logger.log('Execute logout', sessionId);

		return this.sessionService.destroy(sessionId);
	}

	async getSessionUser(req: Request): Promise<UserSummaryDto | null> {
		const sessionId = this.sessionCookieService.extract(req);
		if (!sessionId) {
			return null;
		}

		const session = await this.sessionService.get(sessionId);
		if (!session) {
			return null;
		}

		try {
			return await this.userService.findProfileById(session.userId);
		} catch (error) {
			return null;
		}
	}
}
