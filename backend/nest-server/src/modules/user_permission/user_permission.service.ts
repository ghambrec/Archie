import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPermission } from './entities/user_permission.entity';

@Injectable()
export class UserPermissionService {
  constructor(
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
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
}
