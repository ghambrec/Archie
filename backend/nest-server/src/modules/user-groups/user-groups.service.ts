import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserGroup } from './entities/user-group.entity';
import { Repository } from 'typeorm';
import { GetUserGroupsQueryDto } from './dto/user-groups-query.dto';
import { UserGroupsMinimalDto } from './dto/user-groups-minimal.dto';
import { GetUserGroupsMinimalResponseDto } from './dto/user-groups-minimal-response.dt';
import { UserMinimalDto } from './dto/user-minimal.dto';
import { GroupMinimalDto } from './dto/group-minimal.dto';
import { Logger } from 'nestjs-pino';
import { GetGroupsMembersResponseDto } from './dto/group-members-response.dto';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GroupMemberDto } from './dto/group-members.dto';
import { GetGroupsByUserIdResponseDto } from './dto/user-groups-by-userId-response.dto';

@Injectable()
export class UserGroupsService {
  constructor(
    @InjectRepository(UserGroup)// userGroups.entity.ts
    private readonly userGroupRepository: Repository<UserGroup>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: Logger
  ) {}

  async add(userId: string, groupId: string, invitedBy?: string): Promise<UserGroup> {
    this.logger.log({ groupId: groupId, userId: userId }, 'Adding user to group');
    const exists = await this.userGroupRepository.findOneBy({ userId, groupId });
    if (exists){
      this.logger.warn({ userId: userId }, 'User is already a member of this group');
      throw new ConflictException('Already member');
    }

    const ug = this.userGroupRepository.create({ userId, groupId, invitedBy });
    
    this.logger.log({ groupId: groupId, userId: userId }, 'Added user to group');
    return this.userGroupRepository.save(ug); //will be updated if exists
  }

  async remove(userId: string, groupId: string ) {
    this.logger.log({ groupId: groupId, userId: userId }, 'Removing user from group');

    const res = await this.userGroupRepository.delete({ userId, groupId });
    if (!res.affected) {
      this.logger.warn({ groupId: groupId }, 'Group was not found');
      throw new NotFoundException('Relation not found');
    }

    this.logger.log({ groupId: groupId, userId: userId }, 'Removed user from group');
  }

  async getMembers(groupId: string): Promise<GetGroupsMembersResponseDto>
  {
    this.logger.log({ groupId: groupId }, 'Fetching all members of this group');

    const group = await this.groupRepository.findOneBy({ id: groupId });
    if ( !group ) {
      this.logger.warn({ groupId: groupId }, 'Group could not be fetched');
      throw new NotFoundException('Group not found');
    }

    const entities = await this.userGroupRepository.find({
      where: { groupId },
      relations: { user: true },
      order: { joinedAt: 'DESC' },
    });

    const members: GroupMemberDto[] = entities.map(ug => ({
      userId: ug.userId,
      displayName: ug.user.displayName,
      joinedAt: ug.joinedAt,
      email: ug.user.email,
    }));

    this.logger.log({ groupId: groupId }, 'Fetched all members of this group');
    return {
      groupId: group.id,
      groupName: group.name,
      members
    };
  }

  async getAllUserGroups(query: GetUserGroupsQueryDto): Promise<GetUserGroupsMinimalResponseDto> {
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

// async getGroupById(groupId: string) {
//   return this.getMembers(groupId);
// }

// example response:
// data	      | type: [UserGroup]	Array von UserGroup-Objekten (kein einzelnes Beispiel, nur Typ)
// page	      | 1	Erste Seite (1‑basiert)
// limit      |	20	20 Einträge pro Seite
// total      |	150	Insgesamt 150 Verknüpfungen in der DB
// totalPages |	8	Math.ceil(150 / 20) = 8 Seiten