import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserGroup } from './entities/user-group.entity';
import { Repository } from 'typeorm';
import { Logger } from 'nestjs-pino';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GetGroupsByUserIdResponseDto } from './dto/user-groups-by-userId-response.dto';

@Injectable()
export class AdminUserGroupsService {
  constructor(
    @InjectRepository(UserGroup)// userGroups.entity.ts
    private readonly userGroupRepository: Repository<UserGroup>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: Logger
  ) {}

  async getGroupsByUserId( userId: string ): Promise<GetGroupsByUserIdResponseDto> {
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
}
