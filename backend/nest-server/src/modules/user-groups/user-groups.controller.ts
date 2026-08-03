import { Controller, Param, Post, UseGuards, Body, Req, Delete } from '@nestjs/common';
import { ApiAcceptedResponse, ApiTags } from '@nestjs/swagger';
import { UserGroupsService } from './user-groups.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';

@ApiTags('user-groups')
@Controller('user-groups')
export class UserGroupsController {
  constructor(private readonly userGroupsService: UserGroupsService) {}

  @Post('groups/:groupId/members')
  @UseGuards(SessionAuthGuard)
  async addMember(
    @Param('groupId') groupId: string,
    @Body('userId') userId: string,
    @Req() req: Request & { userId: string },
  ) {
    return this.userGroupsService.add(userId, groupId, req.userId );
  }

  @Delete('groups/:groupId/members/:userId')
  @UseGuards(SessionAuthGuard)
  async removeMember(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string, 
  ) {
    await this.userGroupsService.remove(userId, groupId);
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