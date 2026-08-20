import { Controller, Param, Post, UseGuards, Body, Req, Delete, Query, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { GetGroupsByUserIdResponseDto } from './dto/user-groups-by-userId-response.dto';
import { AdminRequiredGuard } from '../permissions/guards/admin-required.guard';
import { AdminUserGroupsService } from './admin-user-groups.service';

@ApiTags('admin-user-groups')
@Controller('admin-user-groups')
export class AdminUserGroupsController {
  constructor(private readonly adminUserGroupsService: AdminUserGroupsService) {}

  @Get('/userId/:userId/groups')
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  @ApiOperation({
    summary: 'Gets all groups a user is in',
    description: 'Only Admin can call this endpoint: Returns every group a user is listed in based on the userId you request.'
  })
  async getAllGroupByUser(
    @Param('userId') userId: string,
  ): Promise<GetGroupsByUserIdResponseDto> {
    return this.adminUserGroupsService.getGroupsByUserId( userId );
  }
}