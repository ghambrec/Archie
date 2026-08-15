import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionCookieService } from './session/session-cookie.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { User } from '../users/entities/user.entity';
import { UserSummaryDto } from '../users/dto/user-summary.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let sessionCookieService: jest.Mocked<SessionCookieService>;

  const testPassword = 'password1234';
  const testId = 'user-id-1';
  const testMail = 'test@example.com';
  const testName = 'Test User';
  const testSession = 'session-1';

  const user = {
    id: testId,
    email: testMail,
    displayName: testName,
  } as User;

  const res = {} as Response;
  

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            logout: jest.fn(),
            getCurrentUser: jest.fn(),
          },
        },
        {
          provide: SessionCookieService,
          useValue: {
            set: jest.fn(),
            clear: jest.fn(),
            extract: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
    sessionCookieService = module.get(SessionCookieService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('sets the session cookie and returns the user summary', async () => {
      authService.login.mockResolvedValue({ user, sessionId: testSession });

      const result = await controller.login(
        { email: user.email, password: testPassword },
        res,
      );

      expect(authService.login).toHaveBeenCalledWith({
        email: user.email,
        password: testPassword,
      });
      expect(sessionCookieService.set).toHaveBeenCalledWith(res, testSession);
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      });
    });
  });

  describe('register', () => {
    it('sets the session cookie after registering', async () => {
      authService.register.mockResolvedValue(testSession);

      await controller.register(
        { email: user.email, password: testPassword, displayName: testName },
        res,
      );

      expect(authService.register).toHaveBeenCalledWith({
        email: user.email,
        password: testPassword,
        displayName: testName,
      });
      expect(sessionCookieService.set).toHaveBeenCalledWith(res, testSession);
    });
  });

  describe('logout', () => {
    it('destroys the session and clears the cookie', async () => {
      sessionCookieService.extract.mockReturnValue(testSession);
      const req = {} as Request;

      await controller.logout(req, res);

      expect(sessionCookieService.extract).toHaveBeenCalledWith(req);
      expect(authService.logout).toHaveBeenCalledWith(testSession);
      expect(sessionCookieService.clear).toHaveBeenCalledWith(res);
    });
  });

  describe('me', () => {
    it('returns the current user profile', async () => {
      const profile: UserSummaryDto = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        preferredLanguage: 'EN',
        isActive: true,
      };
      authService.getCurrentUser.mockResolvedValue(profile);
      const req = { userId: user.id } as Request;

      const result = await controller.me(req);

      expect(authService.getCurrentUser).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(profile);
    });
  });
});
