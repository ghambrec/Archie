import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminTagsService } from './admin-tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagAdminResponseDto } from './dto/tag-admin-response.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { AdminRequiredGuard } from '../permissions/guards/admin-required.guard';

@ApiTags('admin-tags')
@Controller('tags')
export class AdminTagsController {
  constructor(private readonly adminTagsService: AdminTagsService) {}

  @Post()
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  @ApiOperation({
    summary: 'ADMIN USER: Creates a tag',
    description:
      'Creates a new tag. Body: name, label, and optionally parentId (to nest it under an existing tag), description, and facet (domain|doctype, defaults to domain).',
  })
  async create(@Body() dto: CreateTagDto): Promise<TagAdminResponseDto> {
    return this.adminTagsService.create(dto);
  }
}
