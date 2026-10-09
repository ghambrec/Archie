import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let documentsService: { upload: jest.Mock };

  const userId = 'user-1';
  const groupId = 'group-1';
  const req = { userId } as Request;

  beforeEach(async () => {
    documentsService = { upload: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [{ provide: DocumentsService, useValue: documentsService }],
    })
      .overrideGuard(SessionAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    const file = {
      originalname: 'hello.txt',
      mimetype: 'text/plain',
      size: 11,
      buffer: Buffer.from('hello world'),
    } as Express.Multer.File;

    it('uploads the file into the given group', async () => {
      const response = { id: 'document-1', objectKey: 'documents-key' };
      documentsService.upload.mockResolvedValue(response);

      await expect(controller.upload(req, groupId, file)).resolves.toEqual(response);
      expect(documentsService.upload).toHaveBeenCalledWith(userId, groupId, file);
    });

    it('throws BadRequestException when no file is provided', async () => {
      await expect(
        controller.upload(req, groupId, undefined as unknown as Express.Multer.File),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(documentsService.upload).not.toHaveBeenCalled();
    });
  });
});
