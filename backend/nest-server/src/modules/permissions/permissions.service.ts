import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type Redis from 'ioredis';
import { EntityManager, Repository } from 'typeorm';
import { REDIS_CLIENT } from '../redis/redis.module';
import { UserGroup } from '../user-groups/entities/user-group.entity';
import { Permission } from './entities/permission.entity';

const USER_PERMISSIONS_TTL_SECONDS = 3600;
const USER_IS_ADMIN_TTL_SECONDS = 3600;
export const ADMIN_PERMISSION_KEY = 'admin';

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
	) { }

	async findAll(): Promise<Permission[]> {
		return this.permissionsRepository.find();
	}

	async hasPermission(userId: string, groupId: string, permKey: string): Promise<boolean> {
		const permissionsByGroup = await this.getUserPermissionsByGroupId(userId);
		return permissionsByGroup[groupId]?.includes(permKey) ?? false;
	}

	async getGroupIdsWithPermission(userId: string, permKey: string): Promise<string[]> {
		const permissionsByGroup = await this.getUserPermissionsByGroupId(userId);
		return Object.entries(permissionsByGroup)
			.filter(([, permKeys]) => permKeys.includes(permKey))
			.map(([groupId]) => groupId);
	}

	async getUserPermissionsByGroupId(userId: string): Promise<Record<string, string[]>> {
		const cached = await this.redis.get(userPermissionsKey(userId));
		if (cached) {
			return JSON.parse(cached) as Record<string, string[]>;
		}

		const rows = await this.permissionsRepository
			.createQueryBuilder('permission')
			.innerJoin('user_permission', 'up', 'up.permission_id = permission.id')
			.where('up.user_id = :userId', { userId })
			.select('up.group_id', 'groupId')
			.addSelect('permission.perm_key', 'permKey')
			.getRawMany<{ groupId: string; permKey: string }>();
		
		const permissionsByGroupId: Record<string, string[]> = {};
		for (const row of rows) {
			(permissionsByGroupId[row.groupId] ??= []).push(row.permKey);
		}

		await this.redis.set(
			userPermissionsKey(userId),
			JSON.stringify(permissionsByGroupId),
			'EX',
			USER_PERMISSIONS_TTL_SECONDS
		);

		return permissionsByGroupId;
	}

	async isUserAdmin(userId: string): Promise<boolean> {
		const cached = await this.redis.get(userIsAdminKey(userId));
		if (cached) {
			return cached === 'true';
		}

		const rows: Array<{ isAdmin: boolean }> = await this.userGroupsRepository.query(
			`
		select exists (
			select 1
			from user_permission as up
			inner join permissions as p
				on p.id = up.permission_id
			where
				up.user_id = $1
				and p.perm_key = $2
		) as "isAdmin"
		`,
			[userId, ADMIN_PERMISSION_KEY]
		);

		const isAdmin = rows[0].isAdmin;

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

	async checkForLastAdmin(manager: EntityManager, userId: string, groupId: string): Promise<void> {
		const rows: Array<{ exists: boolean }> = await manager.query(
			`
		select exists (
			select 1
			from user_permission as up
			inner join permissions as p
				on p.id = up.permission_id
			where
				p.perm_key = $1
				and not (up.user_id = $2 and up.group_id = $3)
		) as "exists"
		`,
			[ADMIN_PERMISSION_KEY, userId, groupId]
		);

		if (!rows[0].exists) {
			throw new ConflictException('cannot remove the last admin');
		}
	}
}
