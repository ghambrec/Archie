import { Test, TestingModule } from '@nestjs/testing';
import { UserGroupsService } from './user-groups.service';
import { Repository } from 'typeorm';
import { UserGroup } from './entities/user-group.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { provideMockRepository } from '../groups/test-utils/mock-repositories';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
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

});

//test with: npm test -- user-groups.service.spec.ts
