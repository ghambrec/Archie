import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StorageService } from '../storage/storage.service';

const DOCUMENTS_BUCKET = 'documents';

@Injectable()
export class DocumentsService {
  constructor(private readonly storageService: StorageService) {}

  async upload(file: Express.Multer.File): Promise<{ key: string }> {
    const key = `${randomUUID()}/${file.originalname}`;

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
