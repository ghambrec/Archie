import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { CreateGroupsResponseDto } from './dto/create-groups-response.dto';
import { UpdateGroupsDto } from './dto/update-groups.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
  ) {}
  async create(dto: CreateGroupsDto): Promise<CreateGroupsResponseDto> {
    
    const nameTaken = await this.findByName(dto.name)
    if(nameTaken)
        throw new ConflictException('Name is already taken');

    const groupEntity = this.groupsRepository.create({
      name: dto.name,
      description: dto.description,
      isSystem: dto.isSystem ?? false,
    });

    await this.groupsRepository.save(groupEntity);

    return groupEntity;
  }

  async findByName(name: string): Promise<Group | null> {
    return this.groupsRepository.findOneBy({name: name});
  }

  async get(id: string): Promise<Group> {
    const group = await this.groupsRepository.findOneBy({ id }); // alternative: this.groupRepository.findOneOrFail({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }
    
    return group;
  }

  async getByNameOrFail(name: string): Promise<Group> {
    const group = await this.findByName(name);

    if (!group) {
      throw new NotFoundException(`Group with the name "${name}" not found`);
    }
    return group;
  }

  async findAll(): Promise<Group[]> {
    return this.groupsRepository.find();
  }

  //example code for pagination
  // async findAll(page = 1, limit = 20): Promise<[Group[], number]> {
  //   return this.groupsRepository.findAndCount({
  //     skip: (page - 1) * limit,
  //     take: limit,
  //   })
  // }

  async update(id: string, dto: UpdateGroupsDto): Promise<Group> {
    const group = await this.get(id);

    if ( dto.name && dto.name !== group.name) {
      const nameTaken = await this.findByName(dto.name);
      if (nameTaken) {
        throw new ConflictException('Name is already taken');
      }
    }

    Object.assign(group, dto);
    return this.groupsRepository.save(group);
  }

  async deleteGroup(id: string): Promise<void> {
    const group = await this.groupsRepository.findOneBy({ id });
    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }
    
    // check if user is still in group?

    await this.groupsRepository.remove(group);

    console.log(`Group ${group.id} (${group.name}) has been deleted`);
  }
}
