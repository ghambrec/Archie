import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DocumentPermissionsGuard } from './document-permissions.guard';
import { PermissionsService } from '../../permissions/permissions.service';
import { DocumentPermission } from '../../permissions/permission-keys';
import { ErrorCode } from 'src/common/errors/error-code';

describe('DocumentPermissionsGuard', () => {
  const userId = 'user-1';
  const documentId = '11111111-1111-4111-8111-111111111111';

  let guard: DocumentPermissionsGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let permissionsService: { getGroupIdsWithPermission: jest.Mock };
  let queryBuilder: Record<string, jest.Mock>;
  let documentsRepository: { createQueryBuilder: jest.Mock };

  const createContext = (params: Record<string, unknown>): ExecutionContext =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ userId, params }) }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(DocumentPermission.Read),
    };
    permissionsService = {
      getGroupIdsWithPermission: jest.fn().mockResolvedValue(['group-1']),
    };

    queryBuilder = {};
    ['innerJoin', 'where', 'select'].forEach((method) => {
      queryBuilder[method] = jest.fn().mockReturnValue(queryBuilder);
    });
    queryBuilder.getRawMany = jest
      .fn()
      .mockResolvedValue([{ groupId: 'group-1' }]);
    documentsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    guard = new DocumentPermissionsGuard(
      reflector as unknown as Reflector,
      permissionsService as unknown as PermissionsService,
      documentsRepository as never,
    );
  });

  it('allows access when no permission is required', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(
      guard.canActivate(createContext({ id: documentId })),
    ).resolves.toBe(true);
    expect(documentsRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('allows access when the user has the permission in a group of the document', async () => {
    await expect(
      guard.canActivate(createContext({ id: documentId })),
    ).resolves.toBe(true);

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'document.id = :documentId',
      { documentId },
    );
    expect(permissionsService.getGroupIdsWithPermission).toHaveBeenCalledWith(
      userId,
      DocumentPermission.Read,
    );
  });

  it('allows access when only one of several document groups grants the permission', async () => {
    queryBuilder.getRawMany.mockResolvedValue([
      { groupId: 'group-2' },
      { groupId: 'group-1' },
    ]);

    await expect(
      guard.canActivate(createContext({ id: documentId })),
    ).resolves.toBe(true);
  });

  it('checks the permission set by @RequirePermission()', async () => {
    reflector.getAllAndOverride.mockReturnValue(DocumentPermission.Delete);

    await guard.canActivate(createContext({ id: documentId }));

    expect(permissionsService.getGroupIdsWithPermission).toHaveBeenCalledWith(
      userId,
      DocumentPermission.Delete,
    );
  });

  it('throws Forbidden when the user lacks the permission in all groups of the document', async () => {
    permissionsService.getGroupIdsWithPermission.mockResolvedValue([
      'other-group',
    ]);

    await expect(
      guard.canActivate(createContext({ id: documentId })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws DocumentNotFound when the document does not exist or has no group', async () => {
    queryBuilder.getRawMany.mockResolvedValue([]);

    await expect(
      guard.canActivate(createContext({ id: documentId })),
    ).rejects.toMatchObject({
      code: ErrorCode.DocumentNotFound,
    });
    expect(permissionsService.getGroupIdsWithPermission).not.toHaveBeenCalled();
  });

  it('throws BadRequest when the document id is not a UUID', async () => {
    await expect(
      guard.canActivate(createContext({ id: 'not-a-uuid' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(documentsRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});
