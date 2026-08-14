import { Controller, Body, Post, UseGuards, Delete, Get, Patch, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { ApiTags } from '@nestjs/swagger';
import { UpdateGroupsDto } from './dto/update-groups.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminRequiredGuard } from '../permissions/guards/admin-required.guard';
import { GroupsAdminResponseDto } from './dto/groups-admin-response';
import type { Request } from 'express';

@ApiTags('admin-groups')
@Controller('admin/groups')
export class AdminGroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post('create')
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  async create(@Body() dto: CreateGroupsDto): Promise<GroupsAdminResponseDto> {
    return this.groupsService.adminCreate(dto);
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  async get(@Param('id', new ParseUUIDPipe()) id: string): Promise<GroupsAdminResponseDto> {
    return this.groupsService.adminGet(id);
  }

  @Get('by-name/:name')
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  async getByName(@Param('name') name: string): Promise<GroupsAdminResponseDto> {
    return this.groupsService.adminGetByNameOrFail(name);
  }

  @Get()
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  async findAll(): Promise<GroupsAdminResponseDto[]> {
    return this.groupsService.adminFindAll();
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateGroupsDto): Promise<GroupsAdminResponseDto> {
    return this.groupsService.adminUpdate(id, dto); 
  }

  @Delete(':id')
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    await this.groupsService.adminDeleteGroup(id, req.userId!, true);
    return;
  }
}
