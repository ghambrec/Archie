import { Controller, Body, Post, UseGuards, Delete, Get, Patch, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { AdminGroupsService } from './admin-groups.service';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateGroupsDto } from './dto/update-groups.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminRequiredGuard } from '../permissions/guards/admin-required.guard';
import { GroupsAdminResponseDto } from './dto/groups-admin-response';
import type { Request } from 'express';


@ApiTags('admin-groups')
@Controller('admin/groups')
export class AdminGroupsController {
  constructor(private readonly adminGroupsService: AdminGroupsService) {}

  @Post('create')
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
    @ApiOperation({
        summary: 'ADMIN USER: Creates group',
        description: 'This endpoint is only accessible by an admin user and creates a group. You set name and description in the body and it returns you id, name, description and isSystem bool.'
      })
  async create(@Body() dto: CreateGroupsDto): Promise<GroupsAdminResponseDto> {
    return this.adminGroupsService.adminCreate(dto);
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
   @ApiOperation({
      summary: 'ADMIN USER: Get group by id',
      description: 'This endpoint is only accessible by an admin user and gets you information about one group. You enter the groupId for the group you want. It returns you id, name, description and isSystem bool about the group.'
    })
  async get(@Param('id', new ParseUUIDPipe()) id: string): Promise<GroupsAdminResponseDto> {
    return this.adminGroupsService.adminGet(id);
  }

  @Get('by-name/:name')
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  @ApiOperation({
      summary: 'ADMIN USER: Gets group by name',
      description: 'This endpoint is only accessible by an admin user and does the same as getting group by id, but instead you enter the name of the group and it returns you id, name, description and isSystem bool about the group.'
    })
  async getByName(@Param('name') name: string): Promise<GroupsAdminResponseDto> {
    return this.adminGroupsService.adminGetByNameOrFail(name);
  }

  @Get()
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  @ApiOperation({
      summary: 'ADMIN USER: Gets you all fetchable groups',
      description: 'This endpoint is only accessible by an admin user and is returning all groups visible to the regular user, even system groups.'
    })
  async findAll(): Promise<GroupsAdminResponseDto[]> {
    return this.adminGroupsService.adminFindAll();
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  @ApiOperation({
      summary: 'ADMIN USER: Modifies a group',
      description: 'This endpoint is only accessible by an admin user and allows a regular user to enter an groupId and modify the name and description about this group.'
    })
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateGroupsDto): Promise<GroupsAdminResponseDto> {
    return this.adminGroupsService.adminUpdate(id, dto); 
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  @ApiOperation({
      summary: 'ADMIN USER: Deletes group',
      description: 'This endpoint is only accessible by an admin user and allows a admin user to delete a fetchable group based on the groupId he is entering - even groups he is no part of. Returning only response headers.'
    })
  async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    await this.adminGroupsService.adminDeleteGroup(id, req.userId!, true);
    return;
  }
}
