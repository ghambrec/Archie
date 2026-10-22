import { ForbiddenException, INestApplication, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersFileService } from './users-file.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminRequiredGuard } from '../permissions/guards/admin-required.guard';
import { SelfOrAdminGuard } from '../permissions/guards/self-or-admin.guard';

describe('PATCH /users/:userId/restore', () => {
  let app: INestApplication;
  let authenticated: boolean;
  let admin: boolean;
  const userId = '657d937c-0275-442c-8fb7-1d464b041850';
  const restoreUser = jest.fn();

  beforeEach(async () => {
    authenticated = true;
    admin = true;
    restoreUser.mockReset().mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: { restoreUser } },
        { provide: UsersFileService, useValue: {} },
      ],
    })
      .overrideGuard(SessionAuthGuard).useValue({ canActivate: () => {
        if (!authenticated) throw new UnauthorizedException();
        return true;
      } })
      .overrideGuard(AdminRequiredGuard).useValue({ canActivate: () => {
        if (!admin) throw new ForbiddenException();
        return true;
      } })
      .overrideGuard(SelfOrAdminGuard).useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => { await app.close(); });

  it('restores the requested user and returns 204 without a body', async () => {
    const response = await request(app.getHttpServer()).patch(`/users/${userId}/restore`).send({}).expect(204);
    expect(response.text).toBe('');
    expect(restoreUser).toHaveBeenCalledWith(userId);
  });

  it('requires authentication', async () => {
    authenticated = false;
    await request(app.getHttpServer()).patch(`/users/${userId}/restore`).expect(401);
    expect(restoreUser).not.toHaveBeenCalled();
  });

  it('rejects non-admins', async () => {
    admin = false;
    await request(app.getHttpServer()).patch(`/users/${userId}/restore`).expect(403);
    expect(restoreUser).not.toHaveBeenCalled();
  });

  it('rejects invalid UUIDs before calling the service', async () => {
    await request(app.getHttpServer()).patch('/users/not-a-uuid/restore').expect(400);
    expect(restoreUser).not.toHaveBeenCalled();
  });

  it.each([
    [404, new NotFoundException()],
    [409, new ConflictException()],
  ])('preserves service error status %s', async (status, error) => {
    restoreUser.mockRejectedValue(error);
    await request(app.getHttpServer()).patch(`/users/${userId}/restore`).expect(status);
  });
});
