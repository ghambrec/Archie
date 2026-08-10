import {
  Controller,
  Get,
  Post,
  Param,
  Query,
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
import { UploadResponseDto } from './dto/upload-response.dto';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { GetDocumentsResponseDto } from './dto/get-documents-response.dto';
import { DocumentSummaryDto } from './dto/document-summary.dto';
import { DownloadUrlResponseDto } from './dto/download-url-response.dto';

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
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file was provided.');
    }

    return this.documentsService.upload(req.userId!, file);
  }

  @UseGuards(SessionAuthGuard)
  @Get()
  async findAll(
    @Req() req: Request,
    @Query() query: GetDocumentsQueryDto,
  ): Promise<GetDocumentsResponseDto> {
    return this.documentsService.findAll(req.userId!, query);
  }

  @UseGuards(SessionAuthGuard)
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<DocumentSummaryDto> {
    return this.documentsService.findOne(req.userId!, id);
  }

  @UseGuards(SessionAuthGuard)
  @Get(':id/download-url')
  async getDownloadUrl(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<DownloadUrlResponseDto> {
    return this.documentsService.getDownloadUrl(req.userId!, id);
  }
}
