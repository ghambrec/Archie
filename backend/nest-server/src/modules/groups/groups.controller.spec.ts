import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { GroupsResponseDto } from './dto/groups-response.dto';

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: jest.Mocked<GroupsService>; // type annotation

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: { // actual mock
            create: jest.fn(),
            get: jest.fn(),
            getByNameOrFail: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            deleteGroup: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: jest.fn(() => true )})
      .compile();

    controller = module.get(GroupsController);
    service = module.get(GroupsService); // mock service
  });

  // GET /groups/:id
  it('GET /groups/:id calls service.get', async () => {
    const expected = { id: 'g1', name: 'Test', description: 'Desc' };
    service.get.mockResolvedValue(expected);

    const result = await controller.get('g1');

    expect(result).toEqual(expected);
    expect(service.get).toHaveBeenCalledWith('g1');
  });

  // GET /groups/by-name/:name
  it('GET /groups/by-name/:name calls service.getByNameOrFail', async () => {
    const expected = { id: 'g1', name: 'Test', description: 'Desc' };
    service.getByNameOrFail.mockResolvedValue(expected);

    const result = await controller.getByName('g1');

    expect(result).toEqual(expected);
    expect(service.getByNameOrFail).toHaveBeenCalledWith('g1');
  });

  // GET /groups
  it('GET /groups calls service.findAll', async () => {
    const expected: GroupsResponseDto[] = [
      { id: '1', name: 'A', description: 'Desc A' },
      { id: '2', name: 'B', description: 'Desc B' },
    ];
    service.findAll.mockResolvedValue(expected);

    const result = await controller.findAll();

    expect(result).toEqual(expected);
    expect(service.findAll).toHaveBeenCalled();
  });

  // PATCH /groups/:id
  it('PATCH /groups/:id calls service.update', async () => {
    const dto = { name: 'New Name' };
    const expected = { id: 'g1', name: 'New Name', description: 'Desc' };
    service.update.mockResolvedValue(expected);
  
    const result = await controller.update('g1', dto);

    expect(result).toEqual(expected);
    expect(service.update).toHaveBeenCalledWith('g1', dto);
  });

  it('POST /groups/create calls service', async () => {
    // Arrange testdaten & Mockverhalten definiert
    const dto = { name: 'A', description: 'B' };
    const expected = { id: '1', ...dto };
    service.create.mockResolvedValue(expected);

    // act: call echter controller 
    const result = await controller.create(dto);

    // assert: check
    expect(result).toEqual(expected);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  // DELETE /groups/:id
  it('DELETE /groups/:id calls service.deleteGroup with userId from request', async () => {
    const mockReq = { userId: 'user-123' };
    service.deleteGroup.mockResolvedValue(undefined);

    await controller.remove('g1', mockReq as any );

    expect(service.deleteGroup).toHaveBeenCalledWith('g1', 'user-123', false);
  });

});

//test with: npm test -- groups.controller.spec.ts
