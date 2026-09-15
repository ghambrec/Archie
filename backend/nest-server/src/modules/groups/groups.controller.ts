import { Controller, Body, Post, UseGuards, Delete, Get, Patch, Param, ParseUUIDPipe, Req, Query } from '@nestjs/common';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateGroupsDto } from './dto/update-groups.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminRequiredGuard } from '../permissions/guards/admin-required.guard';
import { GroupsAdminResponseDto } from './dto/groups-admin-response';
import type { Request } from 'express';
import { GroupsService } from './groups.service';
import { GetGroupsQueryDto } from './dto/get-groups-query.dto';


@ApiTags('groups')
@Controller('groups')
export class GroupsController {
	constructor(private readonly groupsService: GroupsService) { }

	@Post('create')
	@UseGuards(SessionAuthGuard, AdminRequiredGuard)
	@ApiOperation({
		summary: 'Creates group',
		description: 'Admin only'
	})
	async create(@Body() dto: CreateGroupsDto): Promise<GroupsAdminResponseDto> {
		return this.groupsService.create(dto);
	}

	@Get(':id')
	@UseGuards(SessionAuthGuard)
	@ApiOperation({
		summary: 'Get group by id',
	})
	async get(@Param('id', new ParseUUIDPipe()) id: string): Promise<GroupsAdminResponseDto> {
		return this.groupsService.get(id);
	}

	@Get()
	@UseGuards(SessionAuthGuard)
	@ApiOperation({
		summary: 'Get groups, optional name filter',
		description: 'Query is optional'
	})
	async findAll(@Query() query: GetGroupsQueryDto): Promise<GroupsAdminResponseDto[]> {
		return this.groupsService.findAll(query.name);
	}

	@Patch(':id')
	@UseGuards(SessionAuthGuard, AdminRequiredGuard)
	@ApiOperation({
		summary: 'Modifies a group',
		description: 'Admin only'
	})
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateGroupsDto): Promise<GroupsAdminResponseDto> {
		return this.groupsService.update(id, dto);
	}

	@Delete(':id')
	@UseGuards(SessionAuthGuard, AdminRequiredGuard)
	@ApiOperation({
		summary: 'Deletes group',
		description: 'Admin only'
	})
	async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
		await this.groupsService.deleteGroup(id, req.userId!, true);
		return;
	}
}
