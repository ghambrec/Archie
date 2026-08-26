import { Controller, Param, Post, UseGuards, Body, Delete, Req, Get } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserGroupsService } from './user-groups.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { GetGroupsMembersResponseDto } from './dto/group-members-response.dto';
import { GetGroupsByUserIdResponseDto } from './dto/user-groups-by-userId-response.dto';
import type { Request } from 'express';

@ApiTags('user-groups')
@Controller('user-groups')
export class UserGroupsController {
  constructor(private readonly userGroupsService: UserGroupsService) {}

  @Post('groups/:groupId/members')
  @UseGuards(SessionAuthGuard)
  @ApiBody({ type: AddMemberDto })
  @ApiOperation({
    summary: 'Adds a user to a group',
    description: 'Adds a user to a group. You enter the groupId of the group you want to add a user to and send the userId in the body of the request.'
  })
  async addMember(
    @Param('groupId') groupId: string,
    @Body() dto: AddMemberDto,
    @Req() req: Request,
  ) {
    return this.userGroupsService.add(dto.userId, groupId, req.userId! );
  }

  @Delete('groups/:groupId/members/:userId')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    summary: 'Deletes a user from a group',
    description: 'This endpoint deletes a user from a group. You need to enter the groupId and userId to specify, which user and which group.'
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
    description: 'This endpoint fetches all members of a specific group - based on the groupId you enter.'
  })
  async getGroupMembers(
    @Param('groupId') groupId: string,
  ): Promise<GetGroupsMembersResponseDto> {
    return this.userGroupsService.getMembers(groupId); // delete group from response
  }

  @Get('me/groups')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    summary: 'Gets all groups for the current user',
    description: 'This endpoint fetches all groups that the user you are currently logged-in with is a member of.'
  })
  async getMyGroups(
    @Req() req: Request,
  ): Promise<GetGroupsByUserIdResponseDto> {
    return this.userGroupsService.getMyGroups(req.userId!);
  }
}


// @Delete('groups/:groupId/members/:userId')
// @UseGuards(SessionAuthGuard)
// async removeMember(
//   @Param('groupId') groupId: string,
//   @Param('userId') userId: string,
// ) {
//   await this.userGroupsService.remove(userId, groupId);
// }