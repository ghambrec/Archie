import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { Not, Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
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

  it('create() should call repository.create with correct data', async () => {
    const dto = { name: 'Test', description: 'Desc' };
    const savedGroup = createMockGroup({ id: 'uuid-1', ...dto });
    repo.findOneBy.mockResolvedValue(null);
    repo.create.mockReturnValue(savedGroup as any);
    repo.save.mockResolvedValue(savedGroup as any);

    await service.create(dto);

    expect(repo.create).toHaveBeenCalledWith({ name: 'Test', description: 'Desc' });
  })  

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

  it('should reject system groups', async () => {
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
    repo.findOneBy.mockResolvedValue(createMockGroup({ id: 'g1', isSystem: true }));
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
  it('should reject an already-used new name', async () => {
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

  it('update() should update group without name change', async () => {
    const existing = createMockGroup({ id: 'g1', name: 'Old' });
    const updated = createMockGroup({ id: 'g1', name: 'Old', description: 'New desc' });

    repo.findOneBy
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(updated); // getss id
    repo.update.mockResolvedValue({ affected: 1} as any);

    const result = await service.update('g1', { description: 'New desc' });
    expect(result).toEqual(new GroupsResponseDto(updated));
    expect(repo.update).toHaveBeenCalledWith('g1', { description: 'New desc' });
  });

  it('update() should update group with new available name', async () => {
    const existing = createMockGroup({ id: 'g1', name: 'Old' });
    const updated = createMockGroup({ id: 'g1', name: 'New' });
    
    repo.findOneBy
      .mockResolvedValueOnce(existing) // get(id)
      .mockResolvedValueOnce(null)     // findGroupByName(newName) - available
      .mockResolvedValueOnce(updated);
    repo.update.mockResolvedValue({ affected: 1 } as any);
    
    const result = await service.update('g1', { name: 'New' });
    expect(result).toEqual(new GroupsResponseDto(updated));
  });

  it('update() should throw if group not found (affected=0)', async () => {
    repo.findOneBy.mockResolvedValue(createMockGroup({ id: 'g1' }));
    repo.update.mockResolvedValue({ affected: 0 } as any);
    await expect(service.update('g1', { name: 'New' })).rejects.toThrow(NotFoundException);
  });

  //deleteGroup
  it('deleteGroup() should throw if group not found', async () => {
  repo.findOneBy.mockResolvedValue(null);
  await expect(service.deleteGroup('x', 'user1', false)).rejects.toThrow(NotFoundException);
  });

  it('deleteGroup() should throw if system group', async () => {
  repo.findOneBy.mockResolvedValue(createMockGroup({ id: 'g1', isSystem: true }));
  await expect(service.deleteGroup('g1', 'user1', false)).rejects.toThrow(NotFoundException);
  });

  it('deleteGroup() should throw ForbiddenException if user not member', async () => {
  repo.findOneBy.mockResolvedValue(createMockGroup({ id: 'g1' }));
  userGroupRepo.findOneBy.mockResolvedValue(null);
  await expect(service.deleteGroup('g1', 'user1', false)).rejects.toThrow(ForbiddenException);
  });

  it('deleteGroup() should succeed when skipMembershipCheck=true', async () => {
  const group = createMockGroup({ id: 'g1' });
  repo.findOneBy.mockResolvedValue(group);
  await service.deleteGroup('g1', 'user1', true);
  expect(repo.remove).toHaveBeenCalledWith(group);
  });

  it('deleteGroup() should succeed when user is member', async () => {
  const group = createMockGroup({ id: 'g1' });
  repo.findOneBy.mockResolvedValue(group);
  userGroupRepo.findOneBy.mockResolvedValue({} as any);
  await service.deleteGroup('g1', 'user1', false);
  expect(repo.remove).toHaveBeenCalledWith(group);
  });

  it('findAll() should return mapped groups when data exists', async () => {
    const groups = [createMockGroup({ id: '1' }), createMockGroup({ id: '2' })];
    repo.find.mockResolvedValue(groups);
    const result = await service.findAll();
    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(GroupsResponseDto);
  });

});

//test with: npm test -- groups.service.spec.ts