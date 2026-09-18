import { Controller, Param, Post, UseGuards, Body, Delete, Req, Get, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserGroupsService } from './user-groups.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { GetGroupsMembersResponseDto } from './dto/group-members-response.dto';
import { GetGroupsByUserIdResponseDto } from './dto/user-groups-by-userId-response.dto';
import type { Request } from 'express';
import { AdminRequiredGuard } from '../permissions/guards/admin-required.guard';
import { GetUserGroupsQueryDto } from './dto/user-groups-query.dto';

@ApiTags('user-groups')
@Controller('user-groups')
export class UserGroupsController {
	constructor(private readonly userGroupsService: UserGroupsService) { }

	@Post('groups/:groupId/members')
	@UseGuards(SessionAuthGuard, AdminRequiredGuard)
	@ApiBody({ type: AddMemberDto })
	@ApiOperation({
		summary: 'Adds a user to a group',
		description: 'Admin only'
	})
	async addMember(
		@Param('groupId') groupId: string,
		@Body() dto: AddMemberDto,
		@Req() req: Request,
	) {
		return this.userGroupsService.add(dto.userId, groupId, req.userId!);
	}

	@Delete('groups/:groupId/members/:userId')
	@UseGuards(SessionAuthGuard, AdminRequiredGuard)
	@ApiOperation({
		summary: 'Deletes a user from a group',
		description: 'Admin only'
	})
	async removeMember(
		@Param('groupId') groupId: string,
		@Param('userId') userId: string,
	) {
		await this.userGroupsService.remove(userId, groupId);
	}

	@Get('groups/:groupId/members')
	@UseGuards(SessionAuthGuard)
	@ApiOperation({
		summary: 'Gets all user of a group',
		description: 'Admin can get infos about all groups<br>User only about the groups he is member of'
	})
	async getGroupMembers(@Param('groupId') groupId: string,  @Req() req: Request): Promise<GetGroupsMembersResponseDto> {
		return this.userGroupsService.getMembers(groupId, req.userId!);
	}

	@Get('/userId/:userId/groups')
	@UseGuards(SessionAuthGuard)
	@ApiOperation({
		summary: 'Gets all groups a user is in',
		description: 'Admin call get infos about all users<br>User only for himself'
	})
	async getAllGroupByUser(@Param('userId') userId: string, @Req() req: Request): Promise<GetGroupsByUserIdResponseDto> {
		return this.userGroupsService.getGroupsByUserId(userId, req.userId!);
	}

	// GHA - deactivated, never used
	// @Get()
	// @UseGuards(SessionAuthGuard, AdminRequiredGuard)
	// @ApiOperation({
	// 	summary: 'Gets all user-groups that exist',
	// 	description: 'Only Admin can call this endpoint: Showing every group with every user that is a member of the group.'
	// })
	// async getAll(@Query() query: GetUserGroupsQueryDto) {
	// 	return this.userGroupsService.getAllUserGroups(query);
	// }
}
