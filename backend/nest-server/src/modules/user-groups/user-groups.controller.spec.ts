import { Test, TestingModule } from '@nestjs/testing';
import { UserGroupsController } from './user-groups.controller';
import { UserGroupsService } from './user-groups.service';
import { GetGroupsByUserIdResponseDto } from './dto/user-groups-by-userId-response.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';

describe('UserGroupsController', () => {
  let controller: UserGroupsController;
  let service: jest.Mocked<UserGroupsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserGroupsController],
      providers: [
        {
          provide: UserGroupsService,
          useValue: {
            add: jest.fn(),
            remove: jest.fn(),
            adminGetAllUserGroups: jest.fn(),
            getMembers: jest.fn(),
            adminGetGroupsByUserId: jest.fn(),
            getMyGroups: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) }) // bypassing SessionAuthGuard
      .compile();

    controller = module.get(UserGroupsController);
    service = module.get(UserGroupsService);
  });

  // GET my group
  it('GET /me/groups calls service.getMyGroups', async () => {
    const expected: GetGroupsByUserIdResponseDto = {
      userId: 'u1', displayName: 'Test', email: 't@t.com', groups: []
    };
    service.getMyGroups.mockResolvedValue(expected);

    const result = await controller.getMyGroups({ userId: 'u1' } as any);
    expect(result).toEqual(expected);
    expect(service.getMyGroups).toHaveBeenCalledWith('u1');
  });

  // GET /groups/:groupId/members
  it('GET /groups/:groupId/members calls service.getMembers', async () => {
    const expected = {
      groupId: 'g1',
      groupName: 'Group 1',
      members: [{
        userId: 'u1',
        displayName: 'Alice',
        email: 'a@test.com',
        joinedAt: new Date()
      }]
    };
    service.getMembers.mockResolvedValue(expected);

    const result = await controller.getGroupMembers('g1');

    expect(result).toEqual(expected);
    expect(service.getMembers).toHaveBeenCalledWith('g1');
  });

  it('POST /groups/:groupId/members calls service.add', async () => {
    const dto = { userId: 'u1' };
    const expected = { userId: 'u1', groupId: 'g1', joinedAt: new Date() } as any;
    service.add.mockResolvedValue(expected);

    const result = await controller.addMember('g1', dto, { userId: 'u2' } as any );
    expect(result).toEqual(expected);
    expect(service.add).toHaveBeenCalledWith('u1', 'g1', 'u2');
  });

  // DELETE /groups/:groupId/members/:userId
  it('DELETE /groups/:groupId/members/:userId calls service.remove', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.removeMember('g1', 'u1');

    expect(service.remove).toHaveBeenCalledWith('u1', 'g1');
  });
  
});

//test with: npm test -- user-groups.controller.spec.ts
