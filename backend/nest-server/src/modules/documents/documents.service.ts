import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID, createHash } from 'crypto';
import { Logger } from 'nestjs-pino';
import { StorageService, DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS } from '../storage/storage.service';
import { Document } from './entities/document.entity';
import { DocumentStatus } from './entities/document-status.enum';
import { UploadResponseDto } from './dto/upload-response.dto';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { GetDocumentsResponseDto } from './dto/get-documents-response.dto';
import { DocumentSummaryDto } from './dto/document-summary.dto';
import { DownloadUrlResponseDto } from './dto/download-url-response.dto';
import { DocumentDownloadStreamDto } from './dto/document-download-stream.dto';
import { DocumentGroupResponseDto } from './dto/document-group-response.dto';
import { DocumentRagMetadataDto } from './dto/document-rag-metadata.dto';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';
import { GroupsService } from '../groups/groups.service';
import { DocumentGroupsService } from '../document-groups/document-groups.service';

const DOCUMENTS_BUCKET = 'documents';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly storageService: StorageService,
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    private readonly groupsService: GroupsService,
    private readonly documentGroupsService: DocumentGroupsService,
    private readonly logger: Logger,
  ) {}

  async upload(userId: string, file: Express.Multer.File): Promise<UploadResponseDto> {
    this.logger.log(
      { userId, filename: file.originalname, mimeType: file.mimetype, sizeBytes: file.size },
      'Uploading document',
    );

    const sha256 = createHash('sha256').update(file.buffer).digest('hex');

    const key = `${DOCUMENTS_BUCKET}-${randomUUID()}`;

    await this.storageService.putObject(
      DOCUMENTS_BUCKET,
      key,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
      },
    );

    const insertResult = await this.documentsRepository.insert({
      uploadedBy: userId,
      filename: file.originalname,
      mimeType: file.mimetype,
      objectKey: key,
      sizeBytes: file.size,
      sha256,
      status: DocumentStatus.Uploaded,
    });

    const documentId = insertResult.identifiers[0].id as string;

    this.logger.log({ documentId }, 'Document uploaded successfully');

    return { id: documentId, objectKey: key };
  }

  async findAll(userId: string, query: GetDocumentsQueryDto): Promise<GetDocumentsResponseDto> {
    const { page, limit } = query;

    this.logger.log({ userId, page, limit }, 'Listing documents');

    const [documents, total] = await this.documentsRepository.findAndCount({
      where: { uploadedBy: userId },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        createdAt: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    this.logger.log({ userId, total }, 'Documents listed successfully');

    return {
      data: documents,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string): Promise<DocumentSummaryDto> {

    this.logger.log({ userId, id }, 'Find one document');

    const document = await this.documentsRepository.findOne({
      where: { id, uploadedBy: userId },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        createdAt: true,
      },
    });

    if (!document) {
      throw new ApplicationException(ErrorCode.DocumentNotFound);
    }

    this.logger.log({ userId, id }, 'One document found');

    return document;
  }

  async findByObjectKey(objectKey: string): Promise<DocumentRagMetadataDto> {
    this.logger.log({ objectKey }, 'Finding document metadata by object key');

    const document = await this.documentsRepository.findOne({
      where: { objectKey },
      select: { id: true, uploadedBy: true },
    });

    if (!document) {
      throw new ApplicationException(ErrorCode.DocumentNotFound);
    }

    const groupId = await this.documentGroupsService.getGroupId(document.id);

    this.logger.log({ objectKey, documentId: document.id, groupId }, 'Document metadata found');

    return {
      id: document.id,
      uploadedBy: document.uploadedBy,
      groupId,
    };
  }

  async getDownloadUrl(userId: string, id: string): Promise<DownloadUrlResponseDto> {

    this.logger.log({ userId, id }, 'Create Download Url');

    const document = await this.documentsRepository.findOne({
      where: { id, uploadedBy: userId },
      select: { objectKey: true },
    });

    if (!document) {
      throw new ApplicationException(ErrorCode.DocumentNotFound);
    }

    const url = await this.storageService.getPresignedDownloadUrl(
      DOCUMENTS_BUCKET,
      document.objectKey,
    );

    this.logger.log({ userId, id }, 'Download Url is created');

    return { url, expiresInSeconds: DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS };
  }

  async downloadStream(userId: string, id: string): Promise<DocumentDownloadStreamDto> {

    this.logger.log({ userId, id }, 'Stream document download');

    const document = await this.documentsRepository.findOne({
      where: { id, uploadedBy: userId },
      select: { objectKey: true, filename: true, mimeType: true, sizeBytes: true },
    });

    if (!document) {
      throw new ApplicationException(ErrorCode.DocumentNotFound);
    }

    const stream = await this.storageService.getObject(DOCUMENTS_BUCKET, document.objectKey);

    this.logger.log({ userId, id }, 'Document download stream opened');

    return {
      stream,
      filename: document.filename,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
    };
  }

  async setGroup(
    userId: string,
    id: string,
    groupId: string,
  ): Promise<DocumentGroupResponseDto> {

    this.logger.log({ userId, id, groupId }, 'Assign document to group');

    const document = await this.documentsRepository.findOne({
      where: { id, uploadedBy: userId },
      select: { id: true },
    });

    if (!document) {
      throw new ApplicationException(ErrorCode.DocumentNotFound);
    }

    // TODO: We need check this implementation of get
    await this.groupsService.get(groupId);

    await this.documentGroupsService.setGroup(id, groupId);

    this.logger.log({ userId, id, groupId }, 'Document assigned to group');

    return { documentId: id, groupId };
  }
}
