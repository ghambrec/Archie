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
