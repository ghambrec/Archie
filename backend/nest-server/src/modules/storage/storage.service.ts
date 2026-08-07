import { Inject, Injectable } from '@nestjs/common';
import type { Client } from 'minio';
import type { Readable } from 'stream';
import { MINIO_CLIENT } from './minio/minio.module';

const DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS = 5 * 60;

export interface StoredObjectMetadata {
  [key: string]: string;
}

export interface PutObjectResult {
  etag: string;
  versionId: string | null;
}

@Injectable()
export class StorageService {
  constructor(@Inject(MINIO_CLIENT) private readonly client: Client) {}

  async putObject(
    bucket: string,
    key: string,
    data: Buffer | Readable,
    size: number,
    metadata?: StoredObjectMetadata,
  ): Promise<PutObjectResult> {
    return this.client.putObject(bucket, key, data, size, metadata);
  }

  async removeObject(bucket: string, key: string): Promise<void> {
    await this.client.removeObject(bucket, key);
  }

  async objectExists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.client.statObject(bucket, key);
      return true;
    } catch {
      return false;
    }
  }

  async getPresignedDownloadUrl(
    bucket: string,
    key: string,
    expirySeconds: number = DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    return this.client.presignedUrl('GET', bucket, key, expirySeconds);
  }
}
