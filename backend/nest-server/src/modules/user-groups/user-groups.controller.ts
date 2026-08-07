import { Controller, Param, Post, UseGuards, Body, Req, Delete, Query, Get } from '@nestjs/common';
import { ApiAcceptedResponse, ApiBody, ApiTags } from '@nestjs/swagger';
import { UserGroupsService } from './user-groups.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { GetUserGroupsQueryDto } from './dto/user-groups-query.dto';
import { AddMemberDto } from './dto/add-member.dto';

@ApiTags('user-groups')
@Controller('user-groups')
export class UserGroupsController {
  constructor(private readonly userGroupsService: UserGroupsService) {}

  @Post('groups/:groupId/members')
  @UseGuards(SessionAuthGuard)
  @ApiBody({ type: AddMemberDto })
  async addMember(
    @Param('groupId') groupId: string,
    // @Body('userId') userId: string,
    @Body() dto: AddMemberDto,
    @Req() req: Request & { userId: string },
  ) {
    return this.userGroupsService.add(dto.userId, groupId, req.userId );
  }

  @Delete('groups/:groupId/members/:userId')
  @UseGuards(SessionAuthGuard)
  async removeMember(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string, 
  ) {
    await this.userGroupsService.remove(userId, groupId);
  }

  @Get()
  @UseGuards(SessionAuthGuard)
  async getAll(@Query() query: GetUserGroupsQueryDto) {
    return this.userGroupsService.getAllUserGroups(query);
  }

  // @Get('groups/:groupId')
  // @UseGuards(SessionAuthGuard)
  // async getGroupById(@Param('groupId') groupId: string) {
  //   return this.userGroupsService.getGroupById(groupId);
  // }
}


// @Delete('groups/:groupId/members/:userId')
// @UseGuards(SessionAuthGuard)
// async removeMember(
//   @Param('groupId') groupId: string,
//   @Param('userId') userId: string,
// ) {
//   await this.userGroupsService.remove(userId, groupId);
// }