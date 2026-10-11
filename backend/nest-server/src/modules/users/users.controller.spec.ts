import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersFileService } from './users-file.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminRequiredGuard } from '../permissions/guards/admin-required.guard';
import { SelfOrAdminGuard } from '../permissions/guards/self-or-admin.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { create: jest.Mock };

  beforeEach(async () => {
    usersService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: UsersFileService, useValue: {} },
      ],
    })
      .overrideGuard(SessionAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(AdminRequiredGuard).useValue({ canActivate: () => true })
      .overrideGuard(SelfOrAdminGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates a user and returns its id', async () => {
    usersService.create.mockResolvedValue({ id: 'user-id-123' });

    const result = await controller.create({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    });

    expect(usersService.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    });
    expect(result).toEqual({ id: 'user-id-123' });
  });
});
