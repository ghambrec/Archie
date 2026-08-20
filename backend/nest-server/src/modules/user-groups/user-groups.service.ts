import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserGroup } from './entities/user-group.entity';
import { Repository } from 'typeorm';
import { Logger } from 'nestjs-pino';
import { GetGroupsMembersResponseDto } from './dto/group-members-response.dto';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GroupMemberDto } from './dto/group-members.dto';

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