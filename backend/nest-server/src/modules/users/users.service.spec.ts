import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService user updates', () => {
  const original = { id: 'u1', email: 'one@example.com', displayName: 'One', isActive: true } as User;
  let repository: { findOneBy: jest.Mock; save: jest.Mock };
  let service: UsersService;

  beforeEach(() => {
    repository = {
      findOneBy: jest.fn().mockImplementation(async (query: Partial<User>) => query.id === 'u1' ? { ...original } : null),
      save: jest.fn().mockImplementation(async (user: User) => user),
    };
    service = new UsersService({ log: jest.fn(), warn: jest.fn() } as never, repository as never, {} as never, {} as never, {} as never);
  });

  it('updates an admin-selected user, including active status', async () => {
    await expect(service.updateAdminUser('u1', { email: ' TWO@EXAMPLE.COM ', displayName: ' Two ', isActive: false }))
      .resolves.toEqual({ id: 'u1' });
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ email: 'two@example.com', displayName: 'Two', isActive: false }));
  });

  it('accepts unchanged email and name', async () => {
    await expect(service.updateAdminUser('u1', { email: 'one@example.com', displayName: 'One', isActive: true }))
      .resolves.toEqual({ id: 'u1' });
  });

  it('does not let a profile update change active status', async () => {
    await service.updateProfile('u1', { isActive: false } as never);
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
  });
});
