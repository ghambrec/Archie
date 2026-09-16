import { Group } from './entities/group.entity';
import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { UpdateGroupsDto } from './dto/update-groups.dto';
import { GroupsAdminResponseDto } from './dto/groups-admin-response';
import { UserGroup } from '../user-groups/entities/user-group.entity';
import { Logger } from 'nestjs-pino';
import { DocumentGroup } from '../document-groups/entities/document-group.entity';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class GroupsService {
	constructor(
		@InjectRepository(Group)
		private readonly groupsRepository: Repository<Group>,
		@InjectRepository(UserGroup)
		private readonly userGroupsRepository: Repository<UserGroup>,
		@InjectRepository(DocumentGroup)
		private readonly documentGroupsRepository: Repository<DocumentGroup>,
		private readonly logger: Logger,
		private readonly permissionsService: PermissionsService
	) { }

	async create(dto: CreateGroupsDto): Promise<GroupsAdminResponseDto> {
		this.logger.log({ groupName: dto.name }, 'Admin is creating group');

		const nameTaken = await this.findGroupByName(this.groupsRepository, dto.name)
		if (nameTaken) {
			this.logger.warn({ groupName: dto.name }, 'Group name is already taken');
			throw new ConflictException('Name is already taken');
		}

		const groupEntity = this.groupsRepository.create({
			name: dto.name,
			description: dto.description,
		});

		await this.groupsRepository.save(groupEntity);

		this.logger.log({ grouId: groupEntity.id, groupName: groupEntity.name }, 'Admin created group successfully');
		return new GroupsAdminResponseDto(groupEntity);
	}

	async get(id: string, userId: string): Promise<GroupsAdminResponseDto> {
		this.logger.log({ groupId: id }, 'Fetching group by id');

		const group = await this.groupsRepository.findOneBy({ id });
		if (!group) {
			this.logger.warn({ groupId: id }, 'Group not found');
			throw new NotFoundException(`Group with id ${id} not found`);
		}

		// if user is no admin check whether he is a member of the group
		const isAdmin = await this.permissionsService.isUserAdmin(userId);
		if (!isAdmin) {
			const isMember = await this.isUserMemberOfGroup(this.userGroupsRepository, userId, id);
			if (!isMember) {
				this.logger.warn({ groupId: id }, 'Group found but user is not a member of it');
				throw new NotFoundException(`Group with id ${id} not found`);
			}
		}

		this.logger.log({ groupId: group.id, groupName: group.name }, 'Fetching group successful');
		return new GroupsAdminResponseDto(group);
	}

	async findAll(userId: string, name?: string): Promise<GroupsAdminResponseDto[]> {
		this.logger.log(name ? { name } : {}, 'Fetching groups');
		const isAdmin = await this.permissionsService.isUserAdmin(userId);

		// if admin: return all groups
		if (isAdmin) {
			const groups = await this.groupsRepository.find(name ? {where: { name } } : {});
			return groups.map(group => new GroupsAdminResponseDto(group));
		}

		// is normal user: return only groups user is assigned to
		const memberships = await this.userGroupsRepository.find({ where: { userId } });
		const groupIds = memberships.map(m => m.groupId);
		if (groupIds.length === 0) {
			return [];
		}
		const groups = await this.groupsRepository.find({
			where: name ? { id: In(groupIds), name } : { id: In(groupIds)}
		});
		return groups.map(group => new GroupsAdminResponseDto(group));		
	}

	async update(id: string, dto: UpdateGroupsDto, userId: string): Promise<GroupsAdminResponseDto> {
		this.logger.log({ groupId: id }, 'Admin is updating group');

		const group = await this.get(id, userId);

		if (dto.name && dto.name !== group.name) {
			const nameTaken = await this.findGroupByName(this.groupsRepository, dto.name);
			if (nameTaken) {
				this.logger.warn({ groupName: dto.name }, 'Group name is already taken');
				throw new ConflictException('Name is already taken');
			}
		}
		const result = await this.groupsRepository.update(id, dto);
		if (result.affected === 0) {
			throw new NotFoundException(`Group ${id} not found`)
		}
		const updatedGroup = await this.get(id, userId);

		this.logger.log({ groupId: updatedGroup.id, groupName: updatedGroup.name }, 'Admin updating group successful');
		return updatedGroup;
	}

	async deleteGroup(id: string, userId: string): Promise<void> {
		this.logger.log({ groupId: id, userId: userId }, 'Admin trying to delete group');

		const group = await this.groupsRepository.findOneBy({ id });
		if (!group) {
			this.logger.warn({ groupId: id }, 'Group not found');
			throw new NotFoundException(`Group with id ${id} not found`);
		}

		if (group.isSystem == true) {
			this.logger.warn({ groupId: group.id }, 'Group is system group');
			throw new ForbiddenException('System groups cannot be deleted');
		}

		const documentCount = await this.documentGroupsRepository.countBy({
			groupId: id,
		});
		if (documentCount > 0) {
			throw new ConflictException('Group still contains documents');
		}

		await this.groupsRepository.remove(group);

		this.logger.log({ groupId: group.id, userId: userId }, 'Admin successfully deleted group');
	}

	async isUserMemberOfGroup(userGroupsRepository: Repository<UserGroup>, userId: string, groupId: string): Promise<boolean> {
		const membership = await userGroupsRepository.findOneBy({userId, groupId});
		return !!membership;
	}

	async findGroupByName(groupsRepository: Repository<Group>, name: string): Promise<Group | null> {
		return groupsRepository.findOneBy({name: name});
	}
}
