import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { Not, Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GroupsResponseDto } from './dto/groups-response.dto';
import { createMockGroup } from './test-utils/group.factory';
import { UserGroup } from '../user-groups/entities/user-group.entity';
import { provideMockRepository } from './test-utils/mock-repositories';
import { Logger } from 'nestjs-pino';

describe('GroupsService', () => {
  let service: GroupsService;
  let repo: jest.Mocked<Repository<Group>>;
  let userGroupRepo: jest.Mocked<Repository<UserGroup>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        provideMockRepository(Group),
        provideMockRepository(UserGroup),
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

    service = module.get<GroupsService>(GroupsService);
    repo = module.get(getRepositoryToken(Group));
    userGroupRepo = module.get(getRepositoryToken(UserGroup));
  });

  //create
  it('create() should create a group and return it', async () => {
    //Arrange
    const dto = { name: 'Test', description: 'Desc' };
    const savedGroup = createMockGroup({ id: 'uuid-1', ...dto });
    repo.findOneBy.mockResolvedValue(null);
    repo.create.mockReturnValue(savedGroup as any);
    repo.save.mockResolvedValue(savedGroup as any);
    
    //Act
    const result = await service.create(dto);

    //Assert
    expect(result).toEqual(new GroupsResponseDto(savedGroup));
    expect(repo.save).toHaveBeenCalledWith(savedGroup);
  });

  it('create() should throw if name already exists', async () => {
    repo.findOneBy.mockResolvedValue(createMockGroup({ id: 'x', name: 'Test' }));
    await expect(service.create({ name: 'Test', description: '' })).rejects.toThrow(NotFoundException);
  });

  //get
  it('should return group if found', async () => {
    const group = createMockGroup({ id: 'g1' });
    repo.findOneBy.mockResolvedValue(group);

    const result  = await service.get('g1');

    expect(result).toEqual(new GroupsResponseDto(group));
    expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'g1' });
  });

  it('should reject when group does not exist', async () => {
    repo.findOneBy.mockResolvedValue(null);

    await expect(service.get('g1')).rejects.toThrow(NotFoundException);
  });

  it('shoul reject system groups', async () => {
    repo.findOneBy.mockResolvedValue(
      createMockGroup({ id: 'g1', isSystem: true }),
    );

    await expect(service.get('g1')).rejects.toThrow(NotFoundException);
  });

  // getByNameOrFail
  it('getByNameOrFail() should return group when found', async () => {
    const group = createMockGroup({ id: 'g1', name: 'Test' });
    repo.findOneBy.mockResolvedValue(group);
    const result = await service.getByNameOrFail('Test');
    expect(result).toEqual(new GroupsResponseDto(group));
  })

  it('getByNameOrFail() should throw if not found', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.getByNameOrFail('Missing')).rejects.toThrow(NotFoundException);
  })

  it('getByNameOrFail() should throw if system group', async () => {
    await expect(service.getByNameOrFail('System')).rejects.toThrow(NotFoundException);
  })

  // findAll()
  it('should fetch only regular groups', async () => {
    repo.find.mockResolvedValue([]);

    await service.findAll();

    expect(repo.find).toHaveBeenCalledWith({
      where: { isSystem: false },
    });
  });

  //update
  it('should reject an already-userd new name', async () => {
    const existingGroup = createMockGroup({
      id: 'g1',
      name: 'Old name',
    });

    const conflictingGroup = createMockGroup({
      id: 'g2',
      name: 'Name taken',
    });

    repo.findOneBy.mockResolvedValueOnce(existingGroup).mockResolvedValueOnce(conflictingGroup);
    await expect(
      service.update('g1', { name: 'Taken name' }),
    ).rejects.toThrow(NotFoundException);

    expect(repo.update).not.toHaveBeenCalled();
  });

  //deleteGroup
  

});

//test with: npm test -- groups.service.spec.ts