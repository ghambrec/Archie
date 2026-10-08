import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { TagsService } from './tags.service';
import { TagResponseDto } from './dto/tag-response.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';

@ApiTags('tags')
@Controller('tags')
@UseGuards(SessionAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all tags',
  })
  async findAll(@Req() req: Request): Promise<TagResponseDto[]> {
    return this.tagsService.findAll(req.userId!);
  }

  @Get('with-docs')
  @ApiOperation({
    summary: 'List tags scoped to documents the current user can read',
    description:
      "Returns a flat list of tags with a documentCount, scoped to documents the current user can see (own or shared via a group). Tags with no visible documents are omitted.",
  })
  async tagsWithDocs(@Req() req: Request): Promise<TagResponseDto[]> {
    return this.tagsService.tagsWithDocs(req.userId!);
  }
}
