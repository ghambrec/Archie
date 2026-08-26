import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { RequireGroupPermission } from './decorators/require-group-permission.decorator';
import { GrantPermissionDto } from './dto/grant-permission.dto';
import { UserPermissionResponseDto } from './dto/user-permission-response.dto';
import { GroupPermissionGuard } from './guards/group-permission.guard';
import { UserPermissionService } from './user_permission.service';

@ApiTags('user-permission')
@Controller('user-permission/:groupId/permissions')
@UseGuards(SessionAuthGuard, GroupPermissionGuard)
export class UserPermissionController {
  constructor(private readonly userPermissionService: UserPermissionService) {}

  @Post()
  @RequireGroupPermission('group.manage_users')
  @ApiOperation({
    summary: 'Grant a permission to a user in a group',
    description:
      'Grants the given permission key to a user, scoped to this group. ' +
      'Idempotent: granting a permission the user already has in this group is a no-op. ' +
      'Requires the caller to have `group.manage_users` in this group.',
  })
  async grant(
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
    @Body() dto: GrantPermissionDto,
  ): Promise<void> {
    await this.userPermissionService.grant(dto.userId, groupId, dto.permKey);
  }

  @Delete(':userId/:permKey')
  @RequireGroupPermission('group.manage_users')
  @ApiOperation({
    summary: 'Revoke a permission from a user in a group',
    description:
      'Removes the given permission key from a user, scoped to this group. ' +
      'Idempotent: revoking a permission the user does not have in this group is a no-op. ' +
      'Requires the caller to have `group.manage_users` in this group.',
  })
  async revoke(
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Param('permKey') permKey: string,
  ): Promise<void> {
    await this.userPermissionService.revoke(userId, groupId, permKey);
  }

  @Get()
  @RequireGroupPermission('group.manage_users')
  @ApiOperation({
    summary: 'List permission grants in a group',
    description:
      'Returns every (user, permission) grant scoped to this group. ' +
      'Requires the caller to have `group.manage_users` in this group.',
  })
  async list(
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
  ): Promise<UserPermissionResponseDto[]> {
    return this.userPermissionService.list(groupId);
  }
}
