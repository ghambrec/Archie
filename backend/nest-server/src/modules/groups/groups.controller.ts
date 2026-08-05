import { Controller, Body, Post, UseGuards, Delete, Get, Patch, Param, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { CreateGroupsResponseDto } from './dto/create-groups-response.dto';
import { ApiTags } from '@nestjs/swagger';
import { Group } from './entities/group.entity';
import { UpdateGroupsDto } from './dto/update-groups.dto';

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

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateGroupsDto): Promise<Group> {
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
  // @UseGuards(SessionAuthGuard)
  async remove(@Param('id') id: string): Promise<void> {
    await this.groupsService.deleteGroup(id);
    return;
  }

}
