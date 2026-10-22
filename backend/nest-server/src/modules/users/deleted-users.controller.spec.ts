import { ForbiddenException, INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersFileService } from './users-file.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminRequiredGuard } from '../permissions/guards/admin-required.guard';
import { SelfOrAdminGuard } from '../permissions/guards/self-or-admin.guard';

describe('GET /users/deleted', () => {
  let app: INestApplication;
  let authenticated: boolean;
  let admin: boolean;
  const getDeletedUsers = jest.fn();

  beforeEach(async () => {
    authenticated = true;
    admin = true;
    getDeletedUsers.mockReset().mockResolvedValue({ data: [], page: 1, limit: 100, total: 0, totalPages: 0 });
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: { getDeletedUsers } },
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
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterEach(async () => { await app.close(); });

  it('returns the paginated response for admins and parses query parameters', async () => {
    const response = await request(app.getHttpServer()).get('/users/deleted?limit=100').expect(200);
    expect(response.body).toEqual({ data: [], page: 1, limit: 100, total: 0, totalPages: 0 });
    expect(getDeletedUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 100 }));
  });

  it('requires authentication', async () => {
    authenticated = false;
    await request(app.getHttpServer()).get('/users/deleted').expect(401);
    expect(getDeletedUsers).not.toHaveBeenCalled();
  });

  it('rejects non-admin users', async () => {
    admin = false;
    await request(app.getHttpServer()).get('/users/deleted').expect(403);
    expect(getDeletedUsers).not.toHaveBeenCalled();
  });

  it('rejects invalid pagination', async () => {
    await request(app.getHttpServer()).get('/users/deleted?page=0&limit=invalid').expect(400);
    expect(getDeletedUsers).not.toHaveBeenCalled();
  });
});
