import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { TagsService } from './tags.service';
import { TagResponseDto } from './dto/tag-response.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    summary: 'List tags',
    description:
      "Returns a flat list of tags with a documentCount, scoped to documents the current user can see (own or shared via a group). Tags with no visible documents are omitted.",
  })
  async findAll(@Req() req: Request): Promise<TagResponseDto[]> {
    return this.tagsService.findAll(req.userId!);
  }
}
