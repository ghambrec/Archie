import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  ParseUUIDPipe,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile as UploadedFileDecorator,
  BadRequestException,
  HttpCode,
  HttpStatus,
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
import { SetDocumentTagDto } from './dto/set-document-tag.dto';
import { DocumentTagResponseDto } from './dto/document-tag-response.dto';
import { SetDocumentGroupDto } from './dto/set-document-group.dto';
import { DocumentGroupResponseDto } from './dto/document-group-response.dto';
import { ConfirmSuggestedTagsResponseDto } from './dto/confirm-suggested-tags-response.dto';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';
import { DocumentFileValidationService } from './document-file-validation.service';
import { UploadConfigResponseDto } from './dto/upload-config-response.dto';
import { DocumentPermissionsGuard } from './guards/document-permissions.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { DocumentPermission } from '../permissions/permission-keys';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(
	private readonly documentsService: DocumentsService,
	private readonly documentFileValidationService: DocumentFileValidationService
  ) {}

  @ApiOperation({
    summary: 'Upload a document',
    description:
      'Uploads a file, stores it as a new document owned by the current user and assigns it to the given group.',
  })
  @UseGuards(SessionAuthGuard, PermissionsGuard)
  @RequirePermission(DocumentPermission.Upload)
  @Post('upload/:groupId')
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
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
    @UploadedFileDecorator() file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    if (!file || file.size === 0) {
	  throw new ApplicationException(ErrorCode.DocumentFileEmpty);
    }

    return this.documentsService.upload(req.userId!, groupId, file);
  }

  @ApiOperation({
    summary: 'List documents',
    description: 'Returns a paginated, filterable list of documents in groups where the current user has the documents.read permission.',
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
	summary: 'Get upload configuration'
  })
  @UseGuards(SessionAuthGuard)
  @Get('upload-config')
  getUploadConfig(): UploadConfigResponseDto {
	return this.documentFileValidationService.getUploadConfig();
  }

  @ApiOperation({
    summary: 'Get a document',
    description: 'Returns the metadata summary of a single document by its ID.',
  })
  @UseGuards(SessionAuthGuard, DocumentPermissionsGuard)
  @RequirePermission(DocumentPermission.Read)
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<DocumentSummaryDto> {
    return this.documentsService.findOne(req.userId!, id);
  }

  @ApiOperation({
    summary: 'Assign a tag to a document',
    description: 'Adds the given tag to the document.',
  })
  @UseGuards(SessionAuthGuard, DocumentPermissionsGuard)
  @RequirePermission(DocumentPermission.Update)
  @Post(':id/tags')
  async setTag(
    @Req() req: Request,
    @Param('id') documentId: string,
    @Body() dto: SetDocumentTagDto,
  ): Promise<DocumentTagResponseDto> {
    return this.documentsService.setTag(req.userId!, documentId, dto.tagId);
  }

  @ApiOperation({
    summary: 'Confirm AI-suggested tags',
    description:
      'Assigns all tags suggested by the AI to the document. Proposals for new tags are ignored.',
  })
  @UseGuards(SessionAuthGuard, DocumentPermissionsGuard)
  @RequirePermission(DocumentPermission.Update)
  @Post(':id/tags/confirm-suggestions')
  @HttpCode(HttpStatus.OK)
  async confirmSuggestedTags(
    @Req() req: Request,
    @Param('id') documentId: string,
  ): Promise<ConfirmSuggestedTagsResponseDto> {
    return this.documentsService.confirmSuggestedTags(req.userId!, documentId);
  }

  @UseGuards(SessionAuthGuard, DocumentPermissionsGuard)
  @RequirePermission(DocumentPermission.Read)
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

  res.attachment(documentDownloadStream.filename);
	res.setHeader('Content-Type', documentDownloadStream.mimeType);
	res.setHeader('Content-Length', documentDownloadStream.sizeBytes.toString());
	res.setHeader('X-Content-Type-Options', 'nosniff');

    documentDownloadStream.stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500);
      }
      res.end();
    });

    documentDownloadStream.stream.pipe(res);
  }


  @ApiOperation({
    summary: 'Move a document to another group',
    description:
      'Removes the document from its current group and assigns it to the given group.',
  })
  @UseGuards(SessionAuthGuard, DocumentPermissionsGuard)
  @RequirePermission(DocumentPermission.Update)
  @Put(':id/group')
  async moveToGroup(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SetDocumentGroupDto,
  ): Promise<DocumentGroupResponseDto> {
    return this.documentsService.moveToGroup(req.userId!, id, dto.groupId);
  }

//   @ApiOperation({
//     summary: 'Remove a document from a group',
//     description: 'Removes the given document from the specified group.',
//   })
//   @UseGuards(SessionAuthGuard, DocumentPermissionsGuard)
//   @RequirePermission(DocumentPermission.Update)
//   @Delete(':id/groups/:groupId')
//   @HttpCode(HttpStatus.NO_CONTENT)
//   async removeGroup(
//     @Req() req: Request,
//     @Param('id') id: string,
//     @Param('groupId') groupId: string,
//   ): Promise<void> {
//     return this.documentsService.removeGroup(req.userId!, id, groupId);
//   }

  @ApiOperation({
    summary: 'Remove a tag from a document',
    description: 'Removes the given tag from the specified document.',
  })
  @UseGuards(SessionAuthGuard, DocumentPermissionsGuard)
  @RequirePermission(DocumentPermission.Update)
  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTag(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    return this.documentsService.removeTag(req.userId!, id, tagId);
  }

  @ApiOperation({
    summary: 'Delete a document',
    description: 'Soft-deletes the document by its ID.',
  })
  @UseGuards(SessionAuthGuard, DocumentPermissionsGuard)
  @RequirePermission(DocumentPermission.Delete)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    return this.documentsService.remove(req.userId!, id);
  }
}
