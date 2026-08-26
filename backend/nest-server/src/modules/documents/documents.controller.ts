import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile as UploadedFileDecorator,
  BadRequestException,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { UploadResponseDto } from './dto/upload-response.dto';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { GetDocumentsResponseDto } from './dto/get-documents-response.dto';
import { DocumentSummaryDto } from './dto/document-summary.dto';
import { DownloadUrlResponseDto } from './dto/download-url-response.dto';
import { SetDocumentGroupDto } from './dto/set-document-group.dto';
import { DocumentGroupResponseDto } from './dto/document-group-response.dto';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @ApiOperation({
    summary: 'Upload a document',
    description: 'Uploads a file and stores it as a new document owned by the current user.',
  })
  @UseGuards(SessionAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async upload(
    @Req() req: Request,
    @UploadedFileDecorator() file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file was provided.');
    }

    return this.documentsService.upload(req.userId!, file);
  }

  @ApiOperation({
    summary: 'List documents',
    description: "Returns a paginated, filterable list of the current user's documents.",
  })
  @UseGuards(SessionAuthGuard)
  @Get()
  async findAll(
    @Req() req: Request,
    @Query() query: GetDocumentsQueryDto,
  ): Promise<GetDocumentsResponseDto> {
    return this.documentsService.findAll(req.userId!, query);
  }

  @ApiOperation({
    summary: 'Get a document',
    description: 'Returns the metadata summary of a single document by its ID.',
  })
  @UseGuards(SessionAuthGuard)
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<DocumentSummaryDto> {
    return this.documentsService.findOne(req.userId!, id);
  }

  @ApiOperation({
    summary: 'Assign a document to a group',
    description: 'Sets or changes the group that owns the given document.',
  })
  @UseGuards(SessionAuthGuard)
  @Post(':id/group')
  async setGroup(
    @Req() req: Request,
    @Param('id') documentId: string,
    @Body() dto: SetDocumentGroupDto,
  ): Promise<DocumentGroupResponseDto> {
    return this.documentsService.setGroup(req.userId!, documentId, dto.groupId);
  }

  @ApiOperation({
    summary: '[Don\'t use it] Get a document download URL',
    description: 'Returns a short-lived, pre-signed URL for downloading the document directly.',
  })
  @UseGuards(SessionAuthGuard)
  @Get(':id/download-url')
  async getDownloadUrl(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<DownloadUrlResponseDto> {
    return this.documentsService.getDownloadUrl(req.userId!, id);
  }

  @UseGuards(SessionAuthGuard)
  @Get(':id/download')
  @ApiOperation({
    summary: 'Download a document',
    description: 'Streams the raw file contents of the document as an attachment.',
  })
  async download(
    @Req() req: Request,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    // DocumentDownloadStreamDto
    const documentDownloadStream = await this.documentsService.downloadStream(
      req.userId!,
      id,
    );

    res.setHeader(
      'Content-Type',documentDownloadStream.mimeType);
    res.setHeader(
      'Content-Disposition', `attachment; filename="${documentDownloadStream.filename}"`);
    res.setHeader(
      'Content-Length', documentDownloadStream.sizeBytes.toString());

    documentDownloadStream.stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500);
      }
      res.end();
    });

    documentDownloadStream.stream.pipe(res);
  }
}
