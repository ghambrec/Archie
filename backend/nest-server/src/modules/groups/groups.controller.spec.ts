import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';

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

});

//test with: npm test -- groups.controller.spec.ts
