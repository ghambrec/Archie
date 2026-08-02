import { Injectable } from '@nestjs/common';
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
      descpription: dto.description,
    });

    await this.groupsRepository.save(groupEntity);

    return groupEntity;
  }

  async findByName(name: string): Promise<User | null> {
    return this.groupsRepository.findOneBy({name: name});
  }

}
