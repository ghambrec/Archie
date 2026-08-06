import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserGroup } from './entities/user-group.entity';
import { Repository } from 'typeorm';
import { GetUserGroupsQueryDto } from './dto/user-groups-query.dto';
import { GetUserGroupsResponseDto } from './dto/user-groups-response.dto';

@Injectable()
export class UserGroupsService {
  constructor(
    @InjectRepository(UserGroup)// userGroups.entity.ts
    private readonly userGroupRepository: Repository<UserGroup>,
  ) {}

  async add(userId: string, groupId: string, invitedBy?: string): Promise<UserGroup> {
    const exists = await this.userGroupRepository.findOneBy({ userId, groupId });
    if (exists){
      throw new ConflictException('Already member');
    }

    const ug = this.userGroupRepository.create({ userId, groupId, invitedBy });

    return this.userGroupRepository.save(ug); //will be updated if exists

  }

  async remove(userId: string, groupId: string ) {
    const res = await this.userGroupRepository.delete({ userId, groupId });
    if (!res.affected) {
      throw new NotFoundException('Relation not found');
    }
  }

  async getMembers(groupId: string) {
    return this.userGroupRepository.find({ where: { groupId }, relations: { user: true } });
  }

  async getAllUserGroups(query: GetUserGroupsQueryDto): Promise<GetUserGroupsResponseDto> {
    const page = query.page ?? 1; // Nullish Coalescing Operator
    const limit = query.limit ?? 20; // ist wert NULL, dann 20

    const [data, total] = await this.userGroupRepository.findAndCount({ 
      skip: (page - 1) * limit,
      take: limit,
      order: { joinedAt: 'DESC' },
      relations: { user: true, group: true }
    });

    return { data, page, limit, total, totalPages: Math.ceil(total/limit),};
  }

  async getGroupById(groupId: string) {
    return this.getMembers(groupId);
  }
}


// example response:
// data	      | type: [UserGroup]	Array von UserGroup-Objekten (kein einzelnes Beispiel, nur Typ)
// page	      | 1	Erste Seite (1‑basiert)
// limit      |	20	20 Einträge pro Seite
// total      |	150	Insgesamt 150 Verknüpfungen in der DB
// totalPages |	8	Math.ceil(150 / 20) = 8 Seiten