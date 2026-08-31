import { Test, TestingModule } from '@nestjs/testing';
import { UserGroupsService } from './user-groups.service';
import { Repository } from 'typeorm';
import { UserGroup } from './entities/user-group.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { provideMockRepository } from '../groups/test-utils/mock-repositories';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

describe('UserGroupsService', () => {
  let service: UserGroupsService;
  let userGroupRepo: jest.Mocked<Repository<UserGroup>>;
  let groupRepo: jest.Mocked<Repository<Group>>;
  let userRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserGroupsService,
        provideMockRepository(UserGroup),
        provideMockRepository(Group),
        provideMockRepository(User),
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserGroupsService>(UserGroupsService);
    userGroupRepo = module.get(getRepositoryToken(UserGroup));
    groupRepo = module.get(getRepositoryToken(Group));
    userRepo = module.get(getRepositoryToken(User));
  });

  it('add() should add member and return UserGroup', async () => {
    const ug = { userId: 'u1', groupId: 'g1', invitedBy: 'u2', joinedAt: new Date(), user: null, group: null, inviter: null } as any;
    userGroupRepo.findOneBy.mockResolvedValue(null);
    userGroupRepo.create.mockReturnValue(ug);
    userGroupRepo.save.mockResolvedValue(ug);

    const result = await service.add('u1', 'g1', 'u2');
    expect(result).toEqual(ug);
    expect(userGroupRepo.save).toHaveBeenCalledWith(ug);
  });
  
  it('add() should throw ConflictException if already member', async () => {
    userGroupRepo.findOneBy.mockResolvedValue({} as any);
    await expect(service.add('u1', 'g1')).rejects.toThrow(ConflictException);
  });

  it('remove() should delete user from a group', async () => {
    userGroupRepo.delete.mockResolvedValue({ affected: 1 } as any);
    await expect(service.remove('u1', 'g1')).resolves.toBeUndefined();

    expect(userGroupRepo.delete).toHaveBeenCalledWith({ userId: 'u1', groupId: 'g1' });
  });

  it('remove() should throw NotFoundException if not fouud', async () => {
    userGroupRepo.delete.mockResolvedValue({ affected: 0 } as any);
    await expect(service.remove('u1', 'g1')).rejects.toThrow(NotFoundException);
  });

  // getMembers()
  it('getMembers() should return members for existing group', async () => {
    groupRepo.findOneBy.mockResolvedValue({ id: 'g1', name: 'Group 1' } as any);
    userGroupRepo.find.mockResolvedValue([
      { userId: 'u1', joinedAt: new Date(), user: { displayName: 'Alice', email: 'a@test.com' } },
    ] as any);

    const result = await service.getMembers('g1');
      
    expect(result.groupId).toBe('g1');
    expect(result.groupName).toBe('Group 1');
    expect(result.members[0]).toEqual({
      userId: 'u1',
      displayName: 'Alice',
      email: 'a@test.com',
      joinedAt: expect.any(Date),
    });
  });

  it('getMembers()  should throw NotFoundExpection if group not found', async () => {
    groupRepo.findOneBy.mockResolvedValue(null);
    await expect(service.getMembers('g1')).rejects.toThrow(NotFoundException);
  });

  //getMyGroups
  it('getMyGroups() should return groups for user', async () => {
    userRepo.findOneBy.mockResolvedValue({
      id: 'u1',
      displayName: 'Alice',
      email: 'a@test.com'
    } as any);

    userGroupRepo.find.mockResolvedValue([
      { 
        userId: 'u1',
        groupId: 'g1',
        joinedAt: new Date(),
        group: { id: 'g1', name: 'Group 1' }
      },
    ] as any);

    const result = await service.getMyGroups('u1');

    expect(result.userId).toBe('u1');
    expect(result.displayName).toBe('Alice');
    expect(result.groups[0]).toEqual({
      groupId: 'g1',
      name: 'Group 1',
      joinedAt: expect.any(Date),
    });
  });

  it('getMyGroups() should throw NotFoundExpection if no user found', async () => {
    userRepo.findOneBy.mockResolvedValue(null);
    await expect(service.getMyGroups('u1')).rejects.toThrow(NotFoundException);
  });

});
//test with: npm test -- user-groups.service.spec.ts
