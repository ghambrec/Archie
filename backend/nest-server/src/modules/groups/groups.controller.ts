import { Controller, Body, Post, UseGuards, Delete, Get, Patch, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { GroupsResponseDto } from './dto/groups-response.dto';
import { ApiTags } from '@nestjs/swagger';
import { UpdateGroupsDto } from './dto/update-groups.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { GroupsAdminResponseDto } from './dto/groups-admin-response';
import type { Request } from 'express';

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
  async remove(@Param('id') id: string,  @Req() req: Request ): Promise<void> {
    await this.groupsService.deleteGroup(id, req.userId!, false);
    return;
  }
}