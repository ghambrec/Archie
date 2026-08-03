import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type Redis from 'ioredis';
import { Repository } from 'typeorm';
import { REDIS_CLIENT } from '../redis/redis.module';
import { UserGroup } from '../user-groups/entities/user-group.entity';
import { Permission } from './entities/permission.entity';

const USER_PERMISSIONS_TTL_SECONDS = 3600;
const USER_IS_ADMIN_TTL_SECONDS = 3600;
const ADMIN_GROUP_NAME = 'Admin';

const userPermissionsKey = (userId: string) => `user:${userId}:permissions`;
const userIsAdminKey = (userId: string) => `user:${userId}:isAdmin`;

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(UserGroup)
    private readonly userGroupsRepository: Repository<UserGroup>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionsRepository.find();
  }

  async getUserPermissionKeys(userId: string): Promise<Set<string>> {
    const cached = await this.redis.get(userPermissionsKey(userId));
    if (cached) {
      return new Set(JSON.parse(cached) as string[]);
    }

    const rows = await this.permissionsRepository
      .createQueryBuilder('permission')
      .innerJoin('group_permission', 'gp', 'gp.permission_id = permission.id')
      .innerJoin('user_groups', 'ug', 'ug.group_id = gp.group_id')
      .where('ug.user_id = :userId', { userId })
      .select('DISTINCT permission.perm_key', 'permKey')
      .getRawMany<{ permKey: string }>();

    const permKeys = rows.map((row) => row.permKey);

    await this.redis.set(
      userPermissionsKey(userId),
      JSON.stringify(permKeys),
      'EX',
      USER_PERMISSIONS_TTL_SECONDS,
    );

    return new Set(permKeys);
  }

  async isUserAdmin(userId: string): Promise<boolean> {
    const cached = await this.redis.get(userIsAdminKey(userId));
    if (cached) {
      return cached === 'true';
    }

    const isAdmin = await this.userGroupsRepository
      .createQueryBuilder('userGroup')
      .innerJoin('userGroup.group', 'group')
      .where('userGroup.userId = :userId', { userId })
      .andWhere('group.name = :name', { name: ADMIN_GROUP_NAME })
      .getExists();

    await this.redis.set(
      userIsAdminKey(userId),
      String(isAdmin),
      'EX',
      USER_IS_ADMIN_TTL_SECONDS,
    );

    return isAdmin;
  }

  async invalidateUserPermissions(userId: string): Promise<void> {
    await this.redis.del(userPermissionsKey(userId), userIsAdminKey(userId));
  }

  async invalidateUsersPermissions(userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
      return;
    }

    await this.redis.del([
      ...userIds.map(userPermissionsKey),
      ...userIds.map(userIsAdminKey),
    ]);
  }
}
