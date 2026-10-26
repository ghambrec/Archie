import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionService } from '../session/session.service';
import { SessionCookieService } from '../session/session-cookie.service';
import { User } from '../../users/entities/user.entity';

describe('SessionAuthGuard password-change policy', () => {
  let guard: SessionAuthGuard;
  let user: { mustChangePassword: boolean; lastLoginAt: Date | null };
  const get = jest.fn();
  const extract = jest.fn();
  const findOneBy = jest.fn();
  const context = (method: string, path: string) => ({
    switchToHttp: () => ({ getRequest: () => ({ method, path, params: {} }) }),
  }) as unknown as ExecutionContext;

  beforeEach(async () => {
    user = { mustChangePassword: true, lastLoginAt: new Date() };
    get.mockResolvedValue({ userId: 'target' });
    extract.mockReturnValue('session');
    findOneBy.mockImplementation(async () => user);
    const module = await Test.createTestingModule({
      providers: [
        SessionAuthGuard,
        { provide: SessionService, useValue: { get } },
        { provide: SessionCookieService, useValue: { extract } },
        { provide: getRepositoryToken(User), useValue: { findOneBy } },
      ],
    }).compile();
    guard = module.get(SessionAuthGuard);
  });

  it('blocks ordinary requests when the flag is true even after a successful login', async () => {
    await expect(guard.canActivate(context('GET', '/documents'))).rejects.toMatchObject({ status: 403, message: 'PASSWORD_CHANGE_REQUIRED' });
  });

  it('allows ordinary requests when the flag is false even without a last-login date', async () => {
    user = { mustChangePassword: false, lastLoginAt: null };
    await expect(guard.canActivate(context('GET', '/documents'))).resolves.toBe(true);
  });

  it.each([
    ['PATCH', '/users/me/password'], ['GET', '/auth/logout'], ['GET', '/users/me'],
  ])('permits recovery action %s %s while a password change is required', async (method, path) => {
    await expect(guard.canActivate(context(method, path))).resolves.toBe(true);
  });

  it('does not exempt the administrative password endpoint', async () => {
    await expect(guard.canActivate(context('PATCH', '/users/target/password'))).rejects.toMatchObject({ status: 403 });
  });

  it('still rejects missing sessions', async () => {
    get.mockResolvedValue(null);
    await expect(guard.canActivate(context('GET', '/users/me'))).rejects.toMatchObject({ status: 401 });
  });
});
