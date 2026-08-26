import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserGroup } from './entities/user-group.entity';
import { Repository } from 'typeorm';
import { Logger } from 'nestjs-pino';
import { User } from '../users/entities/user.entity';
import { GetGroupsByUserIdResponseDto } from './dto/user-groups-by-userId-response.dto';
import { GetUserGroupsQueryDto } from './dto/user-groups-query.dto';
import { GetUserGroupsMinimalResponseDto } from './dto/user-groups-minimal-response.dt';
import { UserGroupsMinimalDto } from './dto/user-groups-minimal.dto';
import { UserMinimalDto } from './dto/user-minimal.dto';
import { GroupMinimalDto } from './dto/group-minimal.dto';

@Injectable()
export class AdminUserGroupsService {
  constructor(
    @InjectRepository(UserGroup)// userGroups.entity.ts
    private readonly userGroupRepository: Repository<UserGroup>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: Logger
  ) {}

  async adminGetGroupsByUserId( userId: string ): Promise<GetGroupsByUserIdResponseDto> {
    this.logger.log({ userId: userId }, 'Fetching all groups that user belongs to');

    const user = await this.userRepository.findOneBy({ id: userId });
    if ( !user ) {
      this.logger.log({ userId: userId }, 'User could not be fetched');
      throw new NotFoundException('User not found');
    }

    const entities = await this.userGroupRepository.find({
      where: { userId },
      relations: { group: true }, //JOIN auf Group Entity
      order: { joinedAt: 'DESC' },
    });

    const groups = entities.map( ug => ({
      groupId: ug.groupId,
      name: ug.group.name,
      joinedAt: ug.joinedAt,
    }));

    this.logger.log({ userId: userId }, 'Fetched all groups the user belongs to');
    return {
      userId: user.id,
      displayName: user.displayName,
      email: user.email,
      groups,
    };
  }

  async adminGetAllUserGroups(query: GetUserGroupsQueryDto): Promise<GetUserGroupsMinimalResponseDto> {
    this.logger.log( 'Fetching all possible groups');

    const page = query.page ?? 1; // Nullish Coalescing Operator
    const limit = query.limit ?? 20; // ist wert NULL, dann 20

    const [entities, total] = await this.userGroupRepository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { joinedAt: 'DESC' },
      relations: { user: true, group: true }
    });

    const data: UserGroupsMinimalDto[] = entities.map(ug => ({
      userId: ug.userId,
      groupId: ug.groupId,
      joinedAt: ug.joinedAt,
      user: {
        id: ug.user.id,
        displayName: ug.user.displayName,
        email: ug.user.email,
      } as UserMinimalDto,
      group: {
        id: ug.group.id,
        name: ug.group.name,
      } as GroupMinimalDto,
    }));

    this.logger.log('Fetched all possible groups');
    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total/limit),
    };
  }
}
