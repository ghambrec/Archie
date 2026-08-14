import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { GroupsResponseDto } from './dto/groups-response.dto';
import { UpdateGroupsDto } from './dto/update-groups.dto';
import { UserGroup } from '../user-groups/entities/user-group.entity';
import { Logger } from 'nestjs-pino';
import { isUserMemberOfGroup } from './groups.helper';
import { findGroupByName } from './groups.helper';

// REGULAR USER LOGIC

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private readonly userGroupsRepository: Repository<UserGroup>,
    private readonly logger: Logger
  ) {}

  async create(dto: CreateGroupsDto): Promise<GroupsResponseDto> {
    this.logger.log({ groupName: dto.name }, 'User is creating group')

    const nameTaken = await findGroupByName(this.groupsRepository, dto.name)
    if(nameTaken) {
      this.logger.warn({ groupName: dto.name }, 'Group name is already taken');
      throw new NotFoundException('Group not found');
    }

    const groupEntity = this.groupsRepository.create({
      name: dto.name,
      description: dto.description,
    });

    await this.groupsRepository.save(groupEntity);

    this.logger.log({ grouId: groupEntity.id, groupName: groupEntity.name }, 'User created group successfully');
    return new GroupsResponseDto(groupEntity);
  }

  async get(id: string): Promise<GroupsResponseDto> {
    this.logger.log({ groupId: id }, 'User is fetching group by id');

    const group = await this.groupsRepository.findOneBy({id});
    if (!group || group.isSystem) {
      this.logger.warn({ groupId: id }, 'Group not found or is system group');
      throw new NotFoundException('Cannot create group');
    }

    this.logger.log({ groupId: group.id, groupName: group.name }, 'User fetching group successful');
    return new GroupsResponseDto(group);
  }

  async getByNameOrFail(name: string): Promise<GroupsResponseDto> {
    this.logger.log({ groupName: name }, 'User fetching group by name');

    const group = await findGroupByName(this.groupsRepository, name);

    if (!group || group.isSystem) {
      this.logger.warn({ groupName: name }, 'Group not found or is system group')
      throw new NotFoundException('Group not found');
    }

    this.logger.log({ groupId: group.id, groupName: group.name }, 'User fetching group successfully');
    return new GroupsResponseDto(group);
  }

  async findAll(): Promise<GroupsResponseDto[]> {
    this.logger.log('User fetching all accessible groups');
    const groups = await this.groupsRepository.find({
      where: { isSystem: false }
    });
    return (await groups).map( group => new GroupsResponseDto(group));
  }
  //example code for pagination
  // async findAll(page = 1, limit = 20): Promise<[Group[], number]> {
  //   return this.groupsRepository.findAndCount({
  //     skip: (page - 1) * limit,
  //     take: limit,
  //   })
  // }

  async update(id: string, dto: UpdateGroupsDto): Promise<GroupsResponseDto> {
    this.logger.log({ groupId: id }, 'User is updating group');

    const group = await this.get(id);

    if ( dto.name && dto.name !== group.name) {
      const nameTaken = await findGroupByName(this.groupsRepository, dto.name);
      if (nameTaken) {
        this.logger.warn({ groupName: dto.name }, 'Group name is already taken');
        throw new NotFoundException('Group not found');
      }
    }

    const result = await this.groupsRepository.update(id, dto);
    if ( result.affected === 0 ) {
      throw new NotFoundException(`Group ${id} not found`)
    }
    const updatedGroup = await this.get(id);

    this.logger.log({ groupId: updatedGroup.id, groupName: updatedGroup.name }, 'User updating group successful');
    return updatedGroup;
  }

  async deleteGroup(id: string, userId: string, skipMembershipCheck: boolean): Promise<void> {
    this.logger.log({ groupId: id, userId: userId }, 'User trying to delete group');
    
    const group = await this.groupsRepository.findOneBy({ id });
    if (!group) {
      this.logger.warn({ groupId: id }, 'Group not found');
      throw new NotFoundException('Group not found');
    }
    
    if (group.isSystem == true) {
      this.logger.warn({ groupId: group.id }, 'Group is system group');
      throw new NotFoundException('Group not found');
    }
    if ( !skipMembershipCheck )
      {
      const isMember = await isUserMemberOfGroup(this.userGroupsRepository, userId, group.id); // check if user is still in group?
      if (isMember == false) {
        this.logger.warn({ groupId: group.id, userId: userId }, 'User is not a member of this group');
        throw new ForbiddenException('You are not a member of this group');
      }
    }

    await this.groupsRepository.remove(group);

    this.logger.log({ groupId: group.id, userId: userId }, 'User successfully deleted group');
    console.log(`Group ${group.id} (${group.name}) has been deleted`);
  }

}

//colors for log messages
// separte admin in seperate file
// delete case