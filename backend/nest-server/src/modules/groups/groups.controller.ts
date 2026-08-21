import { Controller, Body, Post, UseGuards, Delete, Get, Patch, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { GroupsResponseDto } from './dto/groups-response.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({
        summary: 'REGULAR USER: Creates group',
        description: 'This endpoint creates a group. You set name and description in the body and it returns you id, name and description.'
      })
  async create(@Body() dto: CreateGroupsDto): Promise<GroupsResponseDto | GroupsAdminResponseDto> {
    return this.groupsService.create(dto);
  }

  @Get(':id')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
      summary: 'REGULAR USER: Get group by id',
      description: 'This endpoint gets you information about one group. You enter the groupId for the group you want. It returns you id, name and description about the group.'
    })
  async get(@Param('id', new ParseUUIDPipe()) id: string): Promise<GroupsResponseDto> {
    return this.groupsService.get(id);
  }

  @Get('by-name/:name')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
      summary: 'REGULAR USER: Gets group by name',
      description: 'This endpoint does the same as getting group by id, but instead you enter the name of the group and it returns you id, name and description about the group.'
    })
  async getByName(@Param('name') name: string): Promise<GroupsResponseDto> {
    return this.groupsService.getByNameOrFail(name);
  }

  @Get()
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
      summary: 'REGULAR USER: Gets you all fetchable groups',
      description: 'This endpoint is returning all groups visible to the regular user - system groups WILL NOT be shown.'
    })
  async findAll(): Promise<GroupsResponseDto[]> {
    return this.groupsService.findAll();
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
      summary: 'REGULAR USER: Modifies a group',
      description: 'This endpoint allows a regular user to enter an groupId and modify the name and description about this group.'
    })
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
  @ApiOperation({
      summary: 'REGULAR USER: Deletes group',
      description: 'This endpoint allows a regular user to delete a fetchable group based on the groupId he is entering - IF the user is member of the group otherwise not. Returning only response headers.'
    })
  async remove(@Param('id') id: string,  @Req() req: Request ): Promise<void> {
    return this.groupsService.deleteGroup(id, req.userId!, false);
  }
}