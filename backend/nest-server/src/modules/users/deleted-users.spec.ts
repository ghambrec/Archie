import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, IsNull, Not } from 'typeorm';
import { Logger } from 'nestjs-pino';
import { UsersService } from './users.service';
import { UsersFileService } from './users-file.service';
import { PermissionsService } from '../permissions/permissions.service';
import { User } from './entities/user.entity';
import { GetUsersQueryDto } from './dto/get-users-query.dto';

describe('Deleted user listing', () => {
  let service: UsersService;
  const findAndCount = jest.fn();

  beforeEach(async () => {
    findAndCount.mockReset();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: { findAndCount } },
        { provide: DataSource, useValue: {} },
        { provide: Logger, useValue: { log: jest.fn() } },
        { provide: UsersFileService, useValue: {} },
        { provide: PermissionsService, useValue: {} },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('queries only deleted users, selects safe fields and paginates the result', async () => {
    const deletedAt = new Date('2026-10-20T12:00:00Z');
    const users = [{ id: 'deleted-user', email: 'deleted@example.com', displayName: 'Deleted',
      preferredLanguage: 'en', isActive: false, lastLoginAt: null, deletedAt }];
    findAndCount.mockResolvedValue([users, 5]);
    const result = await service.getDeletedUsers({ page: 2, limit: 2 });

    expect(findAndCount).toHaveBeenCalledWith({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
      select: { id: true, email: true, displayName: true, preferredLanguage: true,
        isActive: true, lastLoginAt: true, deletedAt: true },
      skip: 2,
      take: 2,
      order: { deletedAt: 'DESC', id: 'ASC' },
    });
    expect(result).toEqual({ data: users, page: 2, limit: 2, total: 5, totalPages: 3 });
  });

  it('returns an empty paginated response when no users have been deleted', async () => {
    findAndCount.mockResolvedValue([[], 0]);
    await expect(service.getDeletedUsers(new GetUsersQueryDto())).resolves.toEqual({
      data: [], page: 1, limit: 20, total: 0, totalPages: 0,
    });
  });
});
