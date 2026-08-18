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
import { group } from 'console';

@Injectable()
export class UserGroupsService {
  constructor(
    @InjectRepository(UserGroup)// userGroups.entity.ts
    private readonly userGroupRepository: Repository<UserGroup>,
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

  async getMembers(groupId: string) {
    this.logger.log({ groupId: groupId }, 'Fetching group members');

    return this.userGroupRepository.find({ where: { groupId }, relations: { user: true } });
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
    return { data, page, limit, total, totalPages: Math.ceil(total/limit),};
  }

  // async getGroupById(groupId: string) {
  //   return this.getMembers(groupId);
  // }
}

// example response:
// data	      | type: [UserGroup]	Array von UserGroup-Objekten (kein einzelnes Beispiel, nur Typ)
// page	      | 1	Erste Seite (1‑basiert)
// limit      |	20	20 Einträge pro Seite
// total      |	150	Insgesamt 150 Verknüpfungen in der DB
// totalPages |	8	Math.ceil(150 / 20) = 8 Seiten