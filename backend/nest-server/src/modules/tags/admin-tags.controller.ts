import { Body, Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminTagsService } from './admin-tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
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

  @Patch(':id')
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  @ApiOperation({
    summary: 'ADMIN USER: Updates a tag',
    description:
      'Updates a tag. Body: name, label, parentId, description, and/or facet (domain|doctype) - all optional, only the given fields are changed.',
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTagDto,
  ): Promise<TagAdminResponseDto> {
    return this.adminTagsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SessionAuthGuard, AdminRequiredGuard)
  @ApiOperation({
    summary: 'ADMIN USER: Deletes a tag',
    description:
      'Deletes a tag. Fails with 409 if the tag still has child tags or is assigned to any document.',
  })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.adminTagsService.remove(id);
  }
}
