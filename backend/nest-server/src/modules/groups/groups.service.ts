import { Group } from './entities/group.entity';
import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { UpdateGroupsDto } from './dto/update-groups.dto';
import { GroupsAdminResponseDto } from './dto/groups-admin-response';
import { UserGroup } from '../user-groups/entities/user-group.entity';
import { Logger } from 'nestjs-pino';
import { isUserMemberOfGroup } from './groups.helper';
import { findGroupByName } from './groups.helper';
import { DocumentGroup } from '../document-groups/entities/document-group.entity';

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
	) { }

	async create(dto: CreateGroupsDto): Promise<GroupsAdminResponseDto> {
		this.logger.log({ groupName: dto.name }, 'Admin is creating group');

		const nameTaken = await findGroupByName(this.groupsRepository, dto.name)
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

	async get(id: string): Promise<GroupsAdminResponseDto> {
		this.logger.log({ groupId: id }, 'Admin is fetching group by id');

		const group = await this.groupsRepository.findOneBy({ id });
		if (!group) {
			this.logger.warn({ groupId: id }, 'Group not found');
			throw new NotFoundException(`Group with id ${id} not found`);
		}

		this.logger.log({ groupId: group.id, groupName: group.name }, 'Admin fetching group successful');
		return new GroupsAdminResponseDto(group);
	}

	async findAll(name?: string): Promise<GroupsAdminResponseDto[]> {
		this.logger.log(name ? { name } : {}, 'Fetching groups');

		const groups = await this.groupsRepository.find(
			name ? {where: { name } } : {},
		);
		return groups.map(group => new GroupsAdminResponseDto(group));
	}

	async update(id: string, dto: UpdateGroupsDto): Promise<GroupsAdminResponseDto> {
		this.logger.log({ groupId: id }, 'Admin is updating group');

		const group = await this.get(id);

		if (dto.name && dto.name !== group.name) {
			const nameTaken = await findGroupByName(this.groupsRepository, dto.name);
			if (nameTaken) {
				this.logger.warn({ groupName: dto.name }, 'Group name is already taken');
				throw new ConflictException('Name is already taken');
			}
		}
		const result = await this.groupsRepository.update(id, dto);
		if (result.affected === 0) {
			throw new NotFoundException(`Group ${id} not found`)
		}
		const updatedGroup = await this.get(id);

		this.logger.log({ groupId: updatedGroup.id, groupName: updatedGroup.name }, 'Admin updating group successful');
		return updatedGroup;
	}

	async deleteGroup(id: string, userId: string, skipMembershipCheck: boolean): Promise<void> {
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

		if (!skipMembershipCheck) {
			const isMember = await isUserMemberOfGroup(this.userGroupsRepository, userId, group.id);
			if (isMember == false) {
				throw new ForbiddenException('You are not a member of this group');
			}
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
}
