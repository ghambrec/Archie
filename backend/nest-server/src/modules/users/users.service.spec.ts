import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Logger } from 'nestjs-pino';
import { UsersService } from './users.service';
import { UsersFileService } from './users-file.service';
import { PermissionsService } from '../permissions/permissions.service';
import { User } from './entities/user.entity';

describe('User creation password-change policy', () => {
  it.each([true, false])('persists mustChangePassword=%s with the password hash', async (mustChangePassword) => {
    const insert = jest.fn().mockResolvedValue({ identifiers: [{ id: 'created-id' }] });
    const manager = {
      insert,
      find: jest.fn().mockResolvedValue([]),
      findOneByOrFail: jest.fn().mockResolvedValue({ id: 'created-id', displayName: 'Test' }),
    };
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: { findOneBy: jest.fn().mockResolvedValue(null) } },
        { provide: DataSource, useValue: { transaction: (callback) => callback(manager) } },
        { provide: Logger, useValue: { log: jest.fn(), warn: jest.fn() } },
        { provide: UsersFileService, useValue: { setDefaultAvatar: jest.fn() } },
        { provide: PermissionsService, useValue: {} },
      ],
    }).compile();

    await module.get(UsersService).create({
      email: 'test@example.com', password: 'password123', displayName: 'Test',
    }, mustChangePassword);

    expect(insert).toHaveBeenCalledWith(User, expect.objectContaining({
      email: 'test@example.com',
      passwordHash: expect.stringMatching(/^\$2[aby]\$/),
      mustChangePassword,
    }));
    await module.close();
  });
});

import * as bcrypt from 'bcrypt';

describe('Password changes', () => {
  let service: UsersService;
  let storedUser: User;
  const findOneBy = jest.fn();
  const save = jest.fn();
  const update = jest.fn();
  const isUserAdmin = jest.fn();
  const lastLoginAt = new Date('2026-10-01T12:00:00Z');

  beforeEach(async () => {
    jest.clearAllMocks();
    storedUser = { id: 'target', email: 'old@example.com', displayName: 'Old',
      passwordHash: 'old-hash', mustChangePassword: true, lastLoginAt } as User;
    findOneBy.mockImplementation(async (where) => where.id ? storedUser : null);
    save.mockImplementation(async (user) => user);
    isUserAdmin.mockResolvedValue(true);
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: { findOneBy, save, update } },
        { provide: DataSource, useValue: {} },
        { provide: Logger, useValue: { log: jest.fn(), warn: jest.fn() } },
        { provide: UsersFileService, useValue: {} },
        { provide: PermissionsService, useValue: { isUserAdmin } },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it.each(['profile', 'reset'])('an admin changing another password via %s sets the flag and hashes the password', async (route) => {
    storedUser.mustChangePassword = false;
    const dto = { password: 'New password123!' };
    if (route === 'profile') await service.updateProfile('admin', 'target', dto);
    else await service.resetPassword('admin', 'target', dto);
    expect(isUserAdmin).toHaveBeenCalledWith('admin');
    const saved = save.mock.calls[0][0];
    expect(saved.mustChangePassword).toBe(true);
    expect(await bcrypt.compare(dto.password, saved.passwordHash)).toBe(true);
    expect(saved).not.toHaveProperty('password');
    expect(saved.lastLoginAt).toEqual(lastLoginAt);
  });

  it.each(['profile', 'reset', 'own'])('changing own password via %s clears the flag without changing last login', async (route) => {
    const dto = { password: 'New password123!' };
    if (route === 'profile') await service.updateProfile('target', 'target', dto);
    else if (route === 'reset') await service.resetPassword('target', 'target', dto);
    else await service.changeOwnPassword('target', dto);
    const saved = save.mock.calls[0][0];
    expect(saved.mustChangePassword).toBe(false);
    expect(await bcrypt.compare(dto.password, saved.passwordHash)).toBe(true);
    expect(saved.lastLoginAt).toEqual(lastLoginAt);
  });

  it.each(['profile', 'reset'])('rejects a non-admin changing another password via %s', async (route) => {
    isUserAdmin.mockResolvedValue(false);
    const operation = route === 'profile'
      ? service.updateProfile('other', 'target', { password: 'New password123!' })
      : service.resetPassword('other', 'target', { password: 'New password123!' });
    await expect(operation).rejects.toMatchObject({ status: 403 });
    expect(save).not.toHaveBeenCalled();
  });

  it.each([
    ['admin', true], ['admin', false], ['target', true], ['target', false],
  ])('profile edits by %s preserve mustChangePassword=%s', async (actor, flag) => {
    storedUser.mustChangePassword = flag as boolean;
    await service.updateProfile(actor as string, 'target', { displayName: 'New', email: 'new@example.com' });
    const saved = save.mock.calls[0][0];
    expect(saved.mustChangePassword).toBe(flag);
    expect(saved.passwordHash).toBe('old-hash');
    expect(saved.lastLoginAt).toEqual(lastLoginAt);
  });

  it('does not accept password policy fields through the general profile payload', async () => {
    await service.updateProfile('target', 'target', {
      displayName: 'New', mustChangePassword: false,
    } as unknown as Parameters<UsersService['updateProfile']>[2]);
    expect(save.mock.calls[0][0].mustChangePassword).toBe(true);
  });

  it('records login time without writing the password or policy flag', async () => {
    await service.recordSuccessfulLogin('target', lastLoginAt);
    expect(update).toHaveBeenCalledWith('target', { lastLoginAt });
    expect(save).not.toHaveBeenCalled();
  });
});
