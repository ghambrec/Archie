import { Inject, Injectable } from '@nestjs/common';
import type { Client } from 'minio';
import type { Readable } from 'stream';
import { MINIO_CLIENT } from './minio/minio.module';
import { ConfigService } from '@nestjs/config';
import { PutObjectResultDto } from './dto/put-object-result';
import { ObjectStatsDto } from './dto/object-stats.dto';
import { StoredObjectMetadataDto } from './dto/stored-object-metadat.dto'

export const DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS = 5 * 60;

@Injectable()
export class StorageService {
  private readonly expireURL: number;
  constructor(
    @Inject(MINIO_CLIENT)
    private readonly client: Client,
    private readonly configService: ConfigService) {
      this.expireURL = this.configService.getOrThrow<number>(
        'storage.urlExpire',
      )
    }

  async putObject(
    bucket: string,
    key: string,
    data: Buffer | Readable,
    size: number,
    metadata?: StoredObjectMetadataDto,
  ): Promise<PutObjectResultDto> {
    return this.client.putObject(bucket, key, data, size, metadata);
  }

  async removeObject(bucket: string, key: string): Promise<void> {
    await this.client.removeObject(bucket, key);
  }

  async getObject(bucket: string, key: string): Promise<Readable> {
    return this.client.getObject(bucket, key);
  }

  async objectExists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.client.statObject(bucket, key);
      return true;
    } catch {
      return false;
    }
  }

  async getStats(bucket: string, key: string): Promise<ObjectStatsDto> {
    const stat = await this.client.statObject(bucket, key);
    return {
      size: stat.size,
      etag: stat.etag,
      lastModified: stat.lastModified,
      metaData: stat.metaData,
    };
  }

  async getPresignedDownloadUrl(
    bucket: string,
    key: string,
    expirySeconds: number = this.expireURL,
  ): Promise<string> {
    return this.client.presignedUrl('GET', bucket, key, expirySeconds);
  }
}
