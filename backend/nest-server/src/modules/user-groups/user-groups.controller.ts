import { Controller, Param, Post, UseGuards, Body, Req, Delete, Query, Get } from '@nestjs/common';
import { ApiAcceptedResponse, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserGroupsService } from './user-groups.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { GetUserGroupsQueryDto } from './dto/user-groups-query.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { GetGroupsMembersResponseDto } from './dto/group-members-response.dto';
import { GetGroupsByUserIdResponseDto } from './dto/user-groups-by-userId-response.dto';
import { AdminRequiredGuard } from '../permissions/guards/admin-required.guard';

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
    @Req() req: Request & { userId: string },
  ) {
    return this.userGroupsService.add(dto.userId, groupId, req.userId );
  }

  @Delete('groups/:groupId/members/:userId')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
      summary: '',
      description: '.'
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
      summary: '',
      description: '.'
    })
  async getGroupMembers(
    @Param('groupId') groupId: string,
  ): Promise<GetGroupsMembersResponseDto> {
    return this.userGroupsService.getMembers(groupId); // delete group from response
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