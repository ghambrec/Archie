import { Repository } from "typeorm";
import { Group } from "./entities/group.entity";
import { UserGroup } from "../user-groups/entities/user-group.entity";

export async function isUserMemberOfGroup(userGroupsRepository: Repository<UserGroup>, userId: string, groupId: string): Promise<boolean> {
  const membership = await userGroupsRepository.findOneBy({userId, groupId});
  return !!membership;
}

export async function findGroupByName(groupsRepository: Repository<Group>, name: string): Promise<Group | null> {
  return groupsRepository.findOneBy({name: name});
}
