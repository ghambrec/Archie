import { Group } from "../entities/group.entity";

export const createMockGroup = (overrides: Partial<Group> = {}): Group => ({
  id: 'uuid-1',
  name: 'Test-Group',
  description: 'Test Description',
  isSystem: false,
  groupUsers: [],
  ...overrides,
} as Group);