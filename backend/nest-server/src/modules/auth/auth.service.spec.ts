import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SessionService } from './session/session.service';
import { LoginAttemptService } from './login-attempt.service';
import { LockedException } from './exceptions/locked.exception';
import { User } from '../users/entities/user.entity';
import { UserSummaryDto } from '../users/dto/user-summary.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UsersService>;
  let sessionService: jest.Mocked<SessionService>;
  let loginAttemptService: jest.Mocked<LoginAttemptService>;

  const user = {
    id: 'user-id-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    preferredLanguage: 'EN',
    isActive: true,
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { 
          provide: Logger,
          useValue: {
            log: jest.fn(),
            warn: jest.fn()
          }
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findProfileById: jest.fn()
          }
        },
        {
          provide: SessionService,
          useValue: {
            create: jest.fn(),
            destroy: jest.fn()
          }
        },
        {
          provide: LoginAttemptService,
          useValue: {
            isLocked: jest.fn(),
            registerFailure: jest.fn(),
            clearAttempts: jest.fn()
          }
        },
      ],
    }).compile();

    service = module.get(AuthService);
    userService = module.get(UsersService);
    sessionService = module.get(SessionService);
    loginAttemptService = module.get(LoginAttemptService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('logs in a user with valid cred entials', async () => {
      loginAttemptService.isLocked.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      sessionService.create.mockResolvedValue('session-1');

      const result = await service.login({ email: user.email, password: 'password1234' });

      expect(loginAttemptService.clearAttempts).toHaveBeenCalledWith(user.email);
      expect(sessionService.create).toHaveBeenCalledWith(user.id);
      expect(result).toEqual({ user, sessionId: 'session-1' });
    });

    it('throws LockedException when the account is locked out', async () => {
      loginAttemptService.isLocked.mockResolvedValue(30);

      await expect(
        service.login({ email: user.email, password: 'password1234' }),
      ).rejects.toThrow(LockedException);

      expect(userService.findByEmail).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException and registers a failure when the user does not exist', async () => {
      loginAttemptService.isLocked.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: user.email, password: 'password1234' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(loginAttemptService.registerFailure).toHaveBeenCalledWith(user.email);
      expect(sessionService.create).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException and registers a failure when the password is wrong', async () => {
      loginAttemptService.isLocked.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: user.email, password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(loginAttemptService.registerFailure).toHaveBeenCalledWith(user.email);
      expect(sessionService.create).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('creates a user and a session', async () => {
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue(user);
      sessionService.create.mockResolvedValue('session-2');

      const result = await service.register({
        email: user.email,
        password: 'password1234',
        displayName: 'Test User',
      });

      expect(userService.create).toHaveBeenCalledWith({
        email: user.email,
        password: 'password1234',
        displayName: 'Test User',
      });
      expect(sessionService.create).toHaveBeenCalledWith(user.id);
      expect(result).toBe('session-2');
    });

  });

  describe('logout', () => {
    it('destroys the session', async () => {
      await service.logout('session-1');

      expect(sessionService.destroy).toHaveBeenCalledWith('session-1');
    });
  });

  describe('getCurrentUser', () => {
    it('returns the user profile', async () => {
      const profile: UserSummaryDto = {
        id: user.id,
        email: user.email,
        displayName: 'Test User',
        preferredLanguage: user.preferredLanguage,
        isActive: user.isActive};

      userService.findProfileById.mockResolvedValue(profile);

      const result = await service.getCurrentUser(user.id);

      expect(userService.findProfileById).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(profile);
    });
  });
});
