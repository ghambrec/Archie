import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Repository } from 'typeorm';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { CreateGroupsResponseDto } from './dto/create-groups-response.dto';

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
