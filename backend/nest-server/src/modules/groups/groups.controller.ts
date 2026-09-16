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
	async get(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request): Promise<GroupsAdminResponseDto> {
		return this.groupsService.get(id, req.userId!);
	}

	@Get()
	@UseGuards(SessionAuthGuard)
	@ApiOperation({
		summary: 'Get groups, optional name filter',
		description: 'Query is optional<br>Admin will get all groups<br>User will get only the groups he is assigned to'
	})
	async findAll(@Query() query: GetGroupsQueryDto, @Req() req: Request): Promise<GroupsAdminResponseDto[]> {
		return this.groupsService.findAll(req.userId!, query.name);
	}

	@Patch(':id')
	@UseGuards(SessionAuthGuard, AdminRequiredGuard)
	@ApiOperation({
		summary: 'Modifies a group',
		description: 'Admin only'
	})
	async update(@Param('id') id: string, @Body() dto: UpdateGroupsDto, @Req() req: Request): Promise<GroupsAdminResponseDto> {
		return this.groupsService.update(id, dto, req.userId!);
	}

	@Delete(':id')
	@UseGuards(SessionAuthGuard, AdminRequiredGuard)
	@ApiOperation({
		summary: 'Deletes group',
		description: 'Admin only'
	})
	async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
		await this.groupsService.deleteGroup(id, req.userId!);
		return;
	}
}
