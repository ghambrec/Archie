import { Controller, Body, Post, UseGuards, Delete, Get, Patch, Param, ParseUUIDPipe } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { GroupsResponseDto } from './dto/groups-response.dto';
import { ApiTags } from '@nestjs/swagger';
import { Group } from './entities/group.entity';
import { UpdateGroupsDto } from './dto/update-groups.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminRequiredGuard } from '../permissions/guards/admin-required.guard';
import { GroupsAdminResponseDto } from './dto/groups-admin-response';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post('create')
  @UseGuards(SessionAuthGuard)
  async create(@Body() dto: CreateGroupsDto): Promise<GroupsResponseDto | GroupsAdminResponseDto> {
    return this.groupsService.create(dto);
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard)
  async get(@Param('id', new ParseUUIDPipe()) id: string): Promise<GroupsResponseDto> {
    return this.groupsService.get(id);
  }

  @Get('by-name/:name')
  @UseGuards(SessionAuthGuard)
  async getByName(@Param('name') name: string): Promise<GroupsResponseDto> {
    return this.groupsService.getByNameOrFail(name);
  }

  @Get()
  @UseGuards(SessionAuthGuard)
  async findAll(): Promise<GroupsResponseDto[]> {
    return this.groupsService.findAll();
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard)
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateGroupsDto): Promise<GroupsResponseDto> {
    return this.groupsService.update(id, dto); 
  }

  //example code for pagination 
  // async findAll(
  //   @Query('page', new DefaultValuePipe(1), ParseIntPipe) page:number,
  //   @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  // ) {
  //   const [data, total] = await this.groupsService.findAll(page, limit);
  //   return { data, total, page, limit };
  // }

  @Delete(':id')
  @UseGuards(SessionAuthGuard)
  async remove(@Param('id') id: string): Promise<void> {
    await this.groupsService.deleteGroup(id);
    return;
  }
}

@ApiTags('admin/groups')
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
  async remove(@Param('id') id: string): Promise<void> {
    await this.groupsService.adminDeleteGroup(id);
    return;
  }
}
