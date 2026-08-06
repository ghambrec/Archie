import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID, createHash } from 'crypto';
import { StorageService } from '../storage/storage.service';
import { Document } from './entities/document.entity';
import { DocumentStatus } from './entities/document-status.enum';

const DOCUMENTS_BUCKET = 'documents';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly storageService: StorageService,
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
  ) {}

  async upload(userId: string, file: Express.Multer.File): Promise<{ key: string }> {
    const sha256 = createHash('sha256').update(file.buffer).digest('hex');

    const document = await this.documentsRepository.save(
        this.documentsRepository.create({
          uploadedBy: userId,
          filename: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          sha256,
          status: DocumentStatus.Uploaded,
        }),
      );

    const key = `${document.id}`;
    
    await this.storageService.putObject(
      DOCUMENTS_BUCKET,
      key,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
      },
    );

    return { key };
  }
}
