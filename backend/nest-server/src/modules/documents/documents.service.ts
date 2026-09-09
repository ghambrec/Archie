import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID, createHash } from 'crypto';
import { Logger } from 'nestjs-pino';
import { StorageService, DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS } from '../storage/storage.service';
import { Document } from './entities/document.entity';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { DocumentGroup } from '../document-groups/entities/document-group.entity';
import { DocumentAiStatus } from './dto/document-ai-status.enum';
import { UploadResponseDto } from './dto/upload-response.dto';
import { GetDocumentsQueryDto } from './dto/get-documents-query.dto';
import { GetDocumentsResponseDto } from './dto/get-documents-response.dto';
import { DocumentSummaryDto } from './dto/document-summary.dto';
import { DownloadUrlResponseDto } from './dto/download-url-response.dto';
import { DocumentDownloadStreamDto } from './dto/document-download-stream.dto';
import { DocumentGroupResponseDto } from './dto/document-group-response.dto';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';
import { GroupsService } from '../groups/groups.service';
import { DocumentGroupsService } from '../document-groups/document-groups.service';
import { AiIngestionService } from '../ai-service/ai-ingestion.service';

const DOCUMENTS_BUCKET = 'documents';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly storageService: StorageService,
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    private readonly groupsService: GroupsService,
    private readonly documentGroupsService: DocumentGroupsService,
    private readonly aiIngestionService: AiIngestionService,
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
    });

    const documentId = insertResult.identifiers[0].id as string;

    this.logger.log({ documentId }, 'Document uploaded successfully');

    await this.aiIngestionService.triggerIngestion(documentId);

    return { id: documentId, objectKey: key };
  }

  async findAll(userId: string, query: GetDocumentsQueryDto): Promise<GetDocumentsResponseDto> {
    const { page, limit } = query;

    this.logger.log({ userId, page, limit }, 'Listing documents');

    const baseQuery = this.documentsRepository
      .createQueryBuilder('document')
      .where('document.uploadedBy = :userId', { userId });

    const total = await baseQuery.getCount();

    const raw = await baseQuery
      .clone()
      .innerJoin(User, 'uploader', 'uploader.id = document.uploadedBy')
      .leftJoin(DocumentGroup, 'documentGroup', 'documentGroup.documentId = document.id')
      .leftJoin(Group, 'group', 'group.id = documentGroup.groupId')
      .select([
        'document.id AS "id"',
        'document.filename AS "filename"',
        'document.mimeType AS "mimeType"',
        'document.sizeBytes AS "sizeBytes"',
        'document.createdAt AS "createdAt"',
        'document.updatedAt AS "updatedAt"',
        'uploader.id AS "uploaderId"',
        'uploader.displayName AS "uploaderName"',
      ])
      .addSelect(
        `COALESCE(
          json_agg(json_build_object('id', "group"."id", 'name', "group"."name"))
            FILTER (WHERE "group"."id" IS NOT NULL),
          '[]'
        )`,
        'groups',
      )
      .groupBy('document.id')
      .addGroupBy('uploader.id')
      .orderBy('document.createdAt', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    const documents = raw.map((row) => ({
      id: row.id,
      filename: row.filename,
      mimeType: row.mimeType,
      sizeBytes: Number(row.sizeBytes),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      uploadedBy: { id: row.uploaderId, name: row.uploaderName },
      groups: row.groups,
      tags: [],
      aiStatus: DocumentAiStatus.PENDING,
      language: '',
    }));

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

    const raw = await this.documentsRepository
      .createQueryBuilder('document')
      .innerJoin(User, 'uploader', 'uploader.id = document.uploadedBy')
      .leftJoin(DocumentGroup, 'documentGroup', 'documentGroup.documentId = document.id')
      .leftJoin(Group, 'group', 'group.id = documentGroup.groupId')
      .where('document.id = :id', { id })
      .andWhere('document.uploadedBy = :userId', { userId })
      .select([
        'document.id AS "id"',
        'document.filename AS "filename"',
        'document.mimeType AS "mimeType"',
        'document.sizeBytes AS "sizeBytes"',
        'document.createdAt AS "createdAt"',
        'document.updatedAt AS "updatedAt"',
        'uploader.id AS "uploaderId"',
        'uploader.displayName AS "uploaderName"',
      ])
      .addSelect(
        `COALESCE(
          json_agg(json_build_object('id', "group"."id", 'name', "group"."name"))
            FILTER (WHERE "group"."id" IS NOT NULL),
          '[]'
        )`,
        'groups',
      )
      .groupBy('document.id')
      .addGroupBy('uploader.id')
      .getRawOne();

    if (!raw) {
      throw new ApplicationException(ErrorCode.DocumentNotFound);
    }

    this.logger.log({ userId, id }, 'One document found');

    return {
      id: raw.id,
      filename: raw.filename,
      mimeType: raw.mimeType,
      sizeBytes: Number(raw.sizeBytes),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      uploadedBy: { id: raw.uploaderId, name: raw.uploaderName },
      groups: raw.groups,
      tags: [],
      aiStatus: DocumentAiStatus.PENDING,
      language: '',
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

  async remove(userId: string, id: string): Promise<void> {

    this.logger.log({ userId, id }, 'Delete document');

    const document = await this.documentsRepository.findOne({
      where: { id, uploadedBy: userId },
      select: { id: true },
    });

    if (!document) {
      throw new ApplicationException(ErrorCode.DocumentNotFound);
    }

    await this.documentsRepository.softDelete(id);

    this.logger.log({ userId, id }, 'Document deleted');
  }
}
