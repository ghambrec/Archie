import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { GroupsResponseDto } from './dto/groups-response.dto';
import { UpdateGroupsDto } from './dto/update-groups.dto';
import { group } from 'console';
import { GroupsAdminResponseDto } from './dto/groups-admin-response';
import { UserGroup } from '../user-groups/entities/user-group.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private readonly userGroupsRepository: Repository<UserGroup>
  ) {}
  // async create(dto: CreateGroupsDto, isAdmin: boolean): Promise<GroupsResponseDto | GroupsAdminResponseDto> {
  async create(dto: CreateGroupsDto): Promise<GroupsResponseDto | GroupsAdminResponseDto> {
    const nameTaken = await this.findByName(dto.name)
    if(nameTaken)
        throw new ConflictException('Name is already taken');

    const groupEntity = this.groupsRepository.create({
      name: dto.name,
      description: dto.description,
      // isSystem: dto.isSystem ?? false,
    });

    await this.groupsRepository.save(groupEntity);
      
    // if ( isAdmin ) {
    //   return new GroupsAdminResponseDto(groupEntity);
    // }

    return new GroupsResponseDto(groupEntity);
  }

  async findByName(name: string): Promise<Group | null> {
    return this.groupsRepository.findOneBy({name: name});
  }

  async get(id: string): Promise<GroupsResponseDto> {
    const group = await this.groupsRepository.findOneBy({ id }); // alternative: this.groupRepository.findOneOrFail({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }
    
    return new GroupsResponseDto(group);
  }

  async getByNameOrFail(name: string): Promise<GroupsResponseDto> {
    const group = await this.findByName(name);

    if (!group) {
      throw new NotFoundException(`Group with the name "${name}" not found`);
    }
    return new GroupsResponseDto(group);
  }

  async findAll(): Promise<GroupsResponseDto[]> {
    const groups = this.groupsRepository.find();
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
    const group = await this.get(id);

    if ( dto.name && dto.name !== group.name) {
      const nameTaken = await this.findByName(dto.name);
      if (nameTaken) {
        throw new ConflictException('Name is already taken');
      }
    }

    Object.assign(group, dto);
    this.groupsRepository.save(group);
    return group;
  }

  async deleteGroup(id: string, userId: string, skipMembershipCheck: boolean): Promise<void> {
    const group = await this.groupsRepository.findOneBy({ id });
    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }
    
    // check if user is still in group?
    if (group.isSystem == true) {
      throw new ForbiddenException('System groups cannot be deleted');
    }
    if ( !skipMembershipCheck )
    {
      const isMember = await this.isUserMemberOfGroup(userId, group.id);
      if (isMember == false) {
        throw new ForbiddenException('You are not a member of this group');
      }
    }

    await this.groupsRepository.remove(group);

    console.log(`Group ${group.id} (${group.name}) has been deleted`);
  }


  // ADMIN LOGIC

  async adminCreate(dto: CreateGroupsDto): Promise<GroupsAdminResponseDto> {
    
    const nameTaken = await this.findByName(dto.name)
    if(nameTaken)
        throw new ConflictException('Name is already taken');

    const groupEntity = this.groupsRepository.create({
      name: dto.name,
      description: dto.description,
      // isSystem: dto.isSystem ?? false,
    });

    await this.groupsRepository.save(groupEntity);

    return new GroupsAdminResponseDto(groupEntity);
  }

  async adminGet(id: string): Promise<GroupsAdminResponseDto> {
    const group = await this.groupsRepository.findOneBy({ id }); // alternative: this.groupRepository.findOneOrFail({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }
    
    return new GroupsAdminResponseDto(group);
  }

  async adminGetByNameOrFail(name: string): Promise<GroupsAdminResponseDto> {
    const group = await this.findByName(name);

    if (!group) {
      throw new NotFoundException(`Group with the name "${name}" not found`);
    }
    return new GroupsAdminResponseDto(group);
  }

  async adminFindAll(): Promise<GroupsAdminResponseDto[]> {
    const groups = this.groupsRepository.find();
    return (await groups).map( group => new GroupsAdminResponseDto(group));
  }

    async adminUpdate(id: string, dto: UpdateGroupsDto): Promise<GroupsAdminResponseDto> {
    const group = await this.adminGet(id);

    if ( dto.name && dto.name !== group.name) {
      const nameTaken = await this.findByName(dto.name);
      if (nameTaken) {
        throw new ConflictException('Name is already taken');
      }
    }

    Object.assign(group, dto);
    this.groupsRepository.save(group);
    return group;
  }

  async adminDeleteGroup(id: string, userId: string, skipMembershipCheck: boolean): Promise<void> {
    const group = await this.groupsRepository.findOneBy({ id });
    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }
    
    // check if user is still in group?
    if (group.isSystem == true) {
      throw new ForbiddenException('System groups cannot be deleted');
    }

    if ( !skipMembershipCheck )
    {
      const isMember = await this.isUserMemberOfGroup(userId, group.id);
      if (isMember == false) {
        throw new ForbiddenException('You are not a member of this group');
      }
    }

    await this.groupsRepository.remove(group);

    console.log(`Group ${group.id} (${group.name}) has been deleted`);
  }

  private async isUserMemberOfGroup(userId: string, groupId: string): Promise<boolean> {
    const membership = await this.userGroupsRepository.findOneBy({userId, groupId});
    return !!membership; //boolean(membership)
  }
}
