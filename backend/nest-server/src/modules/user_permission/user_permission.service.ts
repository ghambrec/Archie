import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { UserPermission } from './entities/user_permission.entity';

@Injectable()
export class UserPermissionService {
  constructor(
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
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

    await this.userPermissionRepository
      .createQueryBuilder()
      .insert()
      .into(UserPermission)
      .values({ userId, groupId, permissionId: permission.id })
      .orIgnore()
      .execute();
  }

  async revoke(
    userId: string,
    groupId: string,
    permKey: string,
  ): Promise<void> {
    const permission = await this.findPermissionOrFail(permKey);

    await this.userPermissionRepository.delete({
      userId,
      groupId,
      permissionId: permission.id,
    });
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
