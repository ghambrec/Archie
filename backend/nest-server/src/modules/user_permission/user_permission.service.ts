import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { UserPermission } from './entities/user_permission.entity';
import { ADMIN_PERMISSION_KEY, PermissionsService } from '../permissions/permissions.service';
import { Group } from '../groups/entities/group.entity';
import { UserGroup } from '../user-groups/entities/user-group.entity';

@Injectable()
export class UserPermissionService {
  constructor(
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
	private readonly permissionsService: PermissionsService,
	@InjectRepository(Group)
	private readonly groupRepository: Repository<Group>,
	@InjectRepository(UserGroup)
	private readonly userGroupRepository: Repository<UserGroup>
  ) {}

  async hasPermission(
    userId: string,
    groupId: string,
    permKey: string,
  ): Promise<boolean> {
    return this.userPermissionRepository
      .createQueryBuilder('userPermission')
      .innerJoin(
        'permissions',
        'permission',
        'permission.id = userPermission.permission_id',
      )
      .where('userPermission.user_id = :userId', { userId })
      .andWhere('userPermission.group_id = :groupId', { groupId })
      .andWhere('permission.perm_key = :permKey', { permKey })
      .getExists();
  }

  async grant(userId: string, groupId: string, permKey: string): Promise<void> {
    const permission = await this.findPermissionOrFail(permKey);

	const group = await this.groupRepository.findOneBy({ id: groupId });
	if (!group) {
		throw new NotFoundException(`Group ${groupId} not found`);
	}

	const isMember = await this.userGroupRepository.existsBy( {userId, groupId });
	if (!isMember) {
		throw new BadRequestException('User is not a member of this group');
	}

    await this.userPermissionRepository
      .createQueryBuilder()
      .insert()
      .into(UserPermission)
      .values({ userId, groupId, permissionId: permission.id })
      .orIgnore()
      .execute();

    await this.permissionsService.invalidateUserPermissions(userId);
  }

  async revoke(
    userId: string,
    groupId: string,
    permKey: string,
  ): Promise<void> {
    const permission = await this.findPermissionOrFail(permKey);

	await this.userPermissionRepository.manager.transaction(async (manager) => {
		if (permKey === ADMIN_PERMISSION_KEY) {
			await this.permissionsService.checkForLastAdmin(manager, userId, groupId);
		}
		await manager.delete(UserPermission, { userId, groupId, permissionId: permission.id });
	});

	await this.permissionsService.invalidateUserPermissions(userId);
  }

  async list(
    groupId: string,
  ): Promise<Array<{ userId: string; permKey: string }>> {
    return this.userPermissionRepository
      .createQueryBuilder('userPermission')
      .innerJoin(
        'permissions',
        'permission',
        'permission.id = userPermission.permission_id',
      )
      .where('userPermission.group_id = :groupId', { groupId })
      .select('userPermission.user_id', 'userId')
      .addSelect('permission.perm_key', 'permKey')
      .getRawMany<{ userId: string; permKey: string }>();
  }

  private async findPermissionOrFail(permKey: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { permKey },
    });

    if (!permission) {
      throw new NotFoundException(`Unknown permission: ${permKey}`);
    }

    return permission;
  }
}
