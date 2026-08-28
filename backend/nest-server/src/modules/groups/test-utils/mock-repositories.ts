import { getRepositoryToken } from "@nestjs/typeorm";
import { ObjectLiteral, Repository } from "typeorm";

export const createMockRepository = <T extends ObjectLiteral>(entity: new () => T): jest.Mocked<Repository<T>> => ({
  findOneBy: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
} as any);

export const provideMockRepository = <T extends ObjectLiteral>(entity: new () => T) => ({
  provide: getRepositoryToken(entity),
  useValue: createMockRepository(entity),
});