import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserGroup } from './entities/user-group.entity';
import { Repository } from 'typeorm';

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

    return this.userGroupRepository.save(ug);
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
}


//   async remove(userId: string, groupId: string) {
//     const res = await this.repo.delete({ userId, groupId });
//     if (!res.affected) throw new NotFoundException('Relation not found');
//   }


//  {
//     if (exists) throw new ConflictException('Already member');
//     return this.repo.save(this.repo.create({ userId, groupId, invitedBy }));
//   }
