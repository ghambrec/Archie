import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger } from 'nestjs-pino';
import { DocumentsService } from './documents.service';
import { StorageService } from '../storage/storage.service';
import { GroupsService } from '../groups/groups.service';
import { DocumentGroupsService } from '../document-groups/document-groups.service';
import { AiIngestionService } from '../ai-service/ai-ingestion.service';
import { TagsService } from '../tags/tags.service';
import { Document } from './entities/document.entity';
import { DocumentAiStatus } from './dto/document-ai-status.enum';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';

type QueryBuilderMock = Record<string, jest.Mock>;

const createQueryBuilderMock = (): QueryBuilderMock => {
  const qb: QueryBuilderMock = {};
  const chainMethods = [
    'where',
    'andWhere',
    'innerJoin',
    'leftJoin',
    'select',
    'addSelect',
    'groupBy',
    'addGroupBy',
    'orderBy',
    'offset',
    'limit',
  ];

  chainMethods.forEach((method) => {
    qb[method] = jest.fn().mockReturnValue(qb);
  });

  qb.clone = jest.fn().mockReturnValue(qb);
  qb.getCount = jest.fn();
  qb.getRawMany = jest.fn();
  qb.getRawOne = jest.fn();

  return qb;
};

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentsRepository: {
    insert: jest.Mock;
    findOne: jest.Mock;
    softDelete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let storageService: { putObject: jest.Mock; getObject: jest.Mock };
  let groupsService: { get: jest.Mock };
  let documentGroupsService: { setGroup: jest.Mock; removeGroup: jest.Mock };
  let aiIngestionService: { triggerIngestion: jest.Mock };
  let tagsService: { assignToDocument: jest.Mock; removeFromDocument: jest.Mock };
  let queryBuilder: QueryBuilderMock;

  const userId = 'user-1';
  const documentId = 'document-1';

  beforeEach(async () => {
    queryBuilder = createQueryBuilderMock();

    documentsRepository = {
      insert: jest.fn(),
      findOne: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    storageService = { putObject: jest.fn(), getObject: jest.fn() };
    groupsService = { get: jest.fn() };
    documentGroupsService = { setGroup: jest.fn(), removeGroup: jest.fn() };
    aiIngestionService = { triggerIngestion: jest.fn().mockResolvedValue(undefined) };
    tagsService = { assignToDocument: jest.fn(), removeFromDocument: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: StorageService, useValue: storageService },
        { provide: getRepositoryToken(Document), useValue: documentsRepository },
        { provide: GroupsService, useValue: groupsService },
        { provide: DocumentGroupsService, useValue: documentGroupsService },
        { provide: AiIngestionService, useValue: aiIngestionService },
        { provide: TagsService, useValue: tagsService },
        { provide: Logger, useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  describe('upload', () => {
    const file = {
      originalname: 'hello.txt',
      mimetype: 'text/plain',
      size: 11,
      buffer: Buffer.from('hello world'),
    } as Express.Multer.File;

    it('stores the file, persists the document and triggers AI ingestion', async () => {
      storageService.putObject.mockResolvedValue(undefined);
      documentsRepository.insert.mockResolvedValue({
        identifiers: [{ id: documentId }],
      });

      const result = await service.upload(userId, file);

      expect(storageService.putObject).toHaveBeenCalledWith(
        'documents',
        expect.any(String),
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype },
      );
      expect(documentsRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadedBy: userId,
          filename: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        }),
      );
      expect(aiIngestionService.triggerIngestion).toHaveBeenCalledWith(documentId);
      expect(result).toEqual({ id: documentId, objectKey: expect.any(String) });
    });
  });

  describe('findAll', () => {
    it('returns a paginated list of the user documents', async () => {
      queryBuilder.getCount.mockResolvedValue(1);
      queryBuilder.getRawMany.mockResolvedValue([
        {
          id: documentId,
          filename: 'hello.txt',
          mimeType: 'text/plain',
          sizeBytes: '11',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          uploaderId: userId,
          uploaderName: 'John Doe',
          groups: [],
          tags: [],
        },
      ]);

      const result = await service.findAll(userId, { page: 1, limit: 20, includeDescendants: false });

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: documentId,
        filename: 'hello.txt',
        sizeBytes: 11,
        uploadedBy: { id: userId, name: 'John Doe' },
        aiStatus: DocumentAiStatus.PENDING,
      });
    });
  });

  describe('findOne', () => {
    it('returns the document summary when it exists', async () => {
      queryBuilder.getRawOne.mockResolvedValue({
        id: documentId,
        filename: 'hello.txt',
        mimeType: 'text/plain',
        sizeBytes: '11',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        uploaderId: userId,
        uploaderName: 'John Doe',
        groups: [],
        tags: [],
      });

      const result = await service.findOne(userId, documentId);

      expect(result).toMatchObject({ id: documentId, filename: 'hello.txt', sizeBytes: 11 });
    });

    it('throws DocumentNotFound when the document does not exist', async () => {
      queryBuilder.getRawOne.mockResolvedValue(undefined);

      await expect(service.findOne(userId, documentId)).rejects.toMatchObject({
        code: ErrorCode.DocumentNotFound,
      });
    });
  });

  describe('downloadStream', () => {
    it('returns the download stream for an existing document', async () => {
      const stream = {} as NodeJS.ReadableStream;
      documentsRepository.findOne.mockResolvedValue({
        objectKey: 'documents-key',
        filename: 'hello.txt',
        mimeType: 'text/plain',
        sizeBytes: 11,
      });
      storageService.getObject.mockResolvedValue(stream);

      const result = await service.downloadStream(userId, documentId);

      expect(storageService.getObject).toHaveBeenCalledWith('documents', 'documents-key');
      expect(result).toEqual({
        stream,
        filename: 'hello.txt',
        mimeType: 'text/plain',
        sizeBytes: 11,
      });
    });

    it('throws DocumentNotFound when the document does not exist', async () => {
      documentsRepository.findOne.mockResolvedValue(null);

      await expect(service.downloadStream(userId, documentId)).rejects.toMatchObject({
        code: ErrorCode.DocumentNotFound,
      });
    });
  });

  describe('setGroup', () => {
    const groupId = 'group-1';

    it('assigns the document to the group', async () => {
      documentsRepository.findOne.mockResolvedValue({ id: documentId });
      groupsService.get.mockResolvedValue(undefined);
      documentGroupsService.setGroup.mockResolvedValue(undefined);

      const result = await service.setGroup(userId, documentId, groupId);

      expect(groupsService.get).toHaveBeenCalledWith(groupId, userId);
      expect(documentGroupsService.setGroup).toHaveBeenCalledWith(documentId, groupId);
      expect(result).toEqual({ documentId, groupId });
    });

    it('throws DocumentNotFound when the document does not exist', async () => {
      documentsRepository.findOne.mockResolvedValue(null);

      await expect(service.setGroup(userId, documentId, groupId)).rejects.toMatchObject({
        code: ErrorCode.DocumentNotFound,
      });
      expect(documentGroupsService.setGroup).not.toHaveBeenCalled();
    });

    it('throws DocumentAlreadyInGroup when the document is already assigned to a group', async () => {
      documentsRepository.findOne.mockResolvedValue({ id: documentId });
      groupsService.get.mockResolvedValue(undefined);
      documentGroupsService.setGroup.mockRejectedValue(
        new ApplicationException(ErrorCode.DocumentAlreadyInGroup),
      );

      await expect(service.setGroup(userId, documentId, groupId)).rejects.toMatchObject({
        code: ErrorCode.DocumentAlreadyInGroup,
      });
    });
  });

  describe('setTag', () => {
    const tagId = 'tag-1';

    it('assigns the tag to the document', async () => {
      documentsRepository.findOne.mockResolvedValue({ id: documentId });
      tagsService.assignToDocument.mockResolvedValue(undefined);

      const result = await service.setTag(userId, documentId, tagId);

      expect(tagsService.assignToDocument).toHaveBeenCalledWith(documentId, tagId);
      expect(result).toEqual({ documentId, tagId });
    });

    it('throws DocumentNotFound when the document does not exist', async () => {
      documentsRepository.findOne.mockResolvedValue(null);

      await expect(service.setTag(userId, documentId, tagId)).rejects.toMatchObject({
        code: ErrorCode.DocumentNotFound,
      });
      expect(tagsService.assignToDocument).not.toHaveBeenCalled();
    });

    it('throws TagNotFound when the tag does not exist', async () => {
      documentsRepository.findOne.mockResolvedValue({ id: documentId });
      tagsService.assignToDocument.mockRejectedValue(
        new ApplicationException(ErrorCode.TagNotFound),
      );

      await expect(service.setTag(userId, documentId, tagId)).rejects.toMatchObject({
        code: ErrorCode.TagNotFound,
      });
    });

    it('throws DocumentTagAlreadyAssigned when the tag is already assigned', async () => {
      documentsRepository.findOne.mockResolvedValue({ id: documentId });
      tagsService.assignToDocument.mockRejectedValue(
        new ApplicationException(ErrorCode.DocumentTagAlreadyAssigned),
      );

      await expect(service.setTag(userId, documentId, tagId)).rejects.toMatchObject({
        code: ErrorCode.DocumentTagAlreadyAssigned,
      });
    });
  });

  describe('removeTag', () => {
    const tagId = 'tag-1';

    it('removes the tag from the document', async () => {
      documentsRepository.findOne.mockResolvedValue({ id: documentId });
      tagsService.removeFromDocument.mockResolvedValue(undefined);

      await service.removeTag(userId, documentId, tagId);

      expect(tagsService.removeFromDocument).toHaveBeenCalledWith(documentId, tagId);
    });

    it('throws DocumentNotFound when the document does not exist', async () => {
      documentsRepository.findOne.mockResolvedValue(null);

      await expect(service.removeTag(userId, documentId, tagId)).rejects.toMatchObject({
        code: ErrorCode.DocumentNotFound,
      });
      expect(tagsService.removeFromDocument).not.toHaveBeenCalled();
    });

    it('throws DocumentTagNotAssigned when the tag is not assigned', async () => {
      documentsRepository.findOne.mockResolvedValue({ id: documentId });
      tagsService.removeFromDocument.mockRejectedValue(
        new ApplicationException(ErrorCode.DocumentTagNotAssigned),
      );

      await expect(service.removeTag(userId, documentId, tagId)).rejects.toMatchObject({
        code: ErrorCode.DocumentTagNotAssigned,
      });
    });
  });

  describe('removeGroup', () => {
    const groupId = 'group-1';

    it('removes the document from the group', async () => {
      documentsRepository.findOne.mockResolvedValue({ id: documentId });
      documentGroupsService.removeGroup.mockResolvedValue(undefined);

      await service.removeGroup(userId, documentId, groupId);

      expect(documentGroupsService.removeGroup).toHaveBeenCalledWith(documentId, groupId);
    });

    it('throws DocumentNotFound when the document does not exist', async () => {
      documentsRepository.findOne.mockResolvedValue(null);

      await expect(service.removeGroup(userId, documentId, groupId)).rejects.toMatchObject({
        code: ErrorCode.DocumentNotFound,
      });
      expect(documentGroupsService.removeGroup).not.toHaveBeenCalled();
    });

    it('throws DocumentNotInGroup when the document is not assigned to the group', async () => {
      documentsRepository.findOne.mockResolvedValue({ id: documentId });
      documentGroupsService.removeGroup.mockRejectedValue(
        new ApplicationException(ErrorCode.DocumentNotInGroup),
      );

      await expect(service.removeGroup(userId, documentId, groupId)).rejects.toMatchObject({
        code: ErrorCode.DocumentNotInGroup,
      });
    });
  });

  describe('remove', () => {
    it('soft-deletes the document', async () => {
      documentsRepository.findOne.mockResolvedValue({ id: documentId });
      documentsRepository.softDelete.mockResolvedValue(undefined);

      await service.remove(userId, documentId);

      expect(documentsRepository.softDelete).toHaveBeenCalledWith(documentId);
    });

    it('throws DocumentNotFound when the document does not exist', async () => {
      documentsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(userId, documentId)).rejects.toMatchObject({
        code: ErrorCode.DocumentNotFound,
      });
      expect(documentsRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
