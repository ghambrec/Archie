import { Controller, Body, Post } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { CreateGroupsResponseDto } from './dto/create-groups-response.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post('create_groups')
  async create(@Body() dto: CreateGroupsDto): Promise<CreateGroupsResponseDto> {
    return this.groupsService.create(dto);
  }
}
