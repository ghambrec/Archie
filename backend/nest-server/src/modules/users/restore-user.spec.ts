import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Logger } from 'nestjs-pino';
import { UsersService } from './users.service';
import { UsersFileService } from './users-file.service';
import { PermissionsService } from '../permissions/permissions.service';
import { SessionService } from '../auth/session/session.service';
import { User } from './entities/user.entity';

describe('Restore user', () => {
  let service: UsersService;
  const userId = '657d937c-0275-442c-8fb7-1d464b041850';
  const findOne = jest.fn();
  const update = jest.fn();
  const destroyAllForUser = jest.fn();
  const invalidateUserPermissions = jest.fn();
  const transaction = jest.fn();

  beforeEach(async () => {
    jest.resetAllMocks();
    findOne.mockResolvedValue({ id: userId, deletedAt: new Date(), isActive: false });
    update.mockResolvedValue({ affected: 1 });
    transaction.mockImplementation(async (callback) => callback({ findOne, update }));
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: DataSource, useValue: { transaction } },
        { provide: Logger, useValue: { log: jest.fn() } },
        { provide: UsersFileService, useValue: {} },
        { provide: SessionService, useValue: { destroyAllForUser } },
        { provide: PermissionsService, useValue: { invalidateUserPermissions } },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('locks the deleted account and revokes sessions and cached permissions before activation', async () => {
    await service.restoreUser(userId);
    expect(findOne).toHaveBeenCalledWith(User, {
      where: { id: userId }, withDeleted: true, lock: { mode: 'pessimistic_write' },
    });
    expect(destroyAllForUser).toHaveBeenCalledWith(userId);
    expect(invalidateUserPermissions).toHaveBeenCalledWith(userId);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(User, userId, { deletedAt: null, isActive: true });
    expect(destroyAllForUser.mock.invocationCallOrder[0]).toBeLessThan(update.mock.invocationCallOrder[0]);
    expect(invalidateUserPermissions.mock.invocationCallOrder[0]).toBeLessThan(update.mock.invocationCallOrder[0]);
  });

  it('returns 404 for an unknown user without touching sessions', async () => {
    findOne.mockResolvedValue(null);
    await expect(service.restoreUser(userId)).rejects.toMatchObject({ status: 404 });
    expect(destroyAllForUser).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('returns 409 for a user who is not deleted', async () => {
    findOne.mockResolvedValue({ id: userId, deletedAt: null, isActive: true });
    await expect(service.restoreUser(userId)).rejects.toMatchObject({ status: 409 });
    expect(destroyAllForUser).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('keeps the account deleted when session revocation fails', async () => {
    destroyAllForUser.mockRejectedValue(new Error('Redis unavailable'));
    await expect(service.restoreUser(userId)).rejects.toThrow('Redis unavailable');
    expect(update).not.toHaveBeenCalled();
  });

  it('keeps the account deleted when cache invalidation fails', async () => {
    invalidateUserPermissions.mockRejectedValue(new Error('Cache unavailable'));
    await expect(service.restoreUser(userId)).rejects.toThrow('Cache unavailable');
    expect(update).not.toHaveBeenCalled();
  });
});
