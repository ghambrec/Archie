import { Controller, Body, Post, UseGuards, Delete, Param } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { CreateGroupsResponseDto } from './dto/create-groups-response.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post('create')
  async create(@Body() dto: CreateGroupsDto): Promise<CreateGroupsResponseDto> {
    return this.groupsService.create(dto);
  }

  @Delete(':id')
  // @UseGuards(SessionAuthGuard)
  async remove(@Param('id') id: string): Promise<void> {
    await this.groupsService.deleteGroup(id);
    return;
  }
}
