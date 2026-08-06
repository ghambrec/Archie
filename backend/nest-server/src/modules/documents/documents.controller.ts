import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile as UploadedFileDecorator,
  BadRequestException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // TODO: Add helpers for swagger like @ApiConsumes and @ApiBody tags
  @UseGuards(SessionAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Req() req: Request,
    @UploadedFileDecorator() file: Express.Multer.File,
  ): Promise<{ key: string }> {
    if (!file) {
      throw new BadRequestException('No file was provided.');
    }

    return this.documentsService.upload(req.userId!, file);
  }
}
