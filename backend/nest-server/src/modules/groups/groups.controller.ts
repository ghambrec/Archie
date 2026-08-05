import { Controller, Body, Post, UseGuards, Delete, Get, Param } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { CreateGroupsResponseDto } from './dto/create-groups-response.dto';
import { ApiTags } from '@nestjs/swagger';
import { Group } from './entities/group.entity';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post('create')
  async create(@Body() dto: CreateGroupsDto): Promise<CreateGroupsResponseDto> {
    return this.groupsService.create(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<Group> {
    return this.groupsService.get(id);
  }

  @Get('by-name/:name')
  async getByName(@Param('name') name: string): Promise<Group> {
    return this.groupsService.getByNameOrFail(name);
  }

  @Get()
  async findAll(): Promise<Group[]> {
    return this.groupsService.findAll();
  }

  @Delete(':id')
  // @UseGuards(SessionAuthGuard)
  async remove(@Param('id') id: string): Promise<void> {
    await this.groupsService.deleteGroup(id);
    return;
  }

}
