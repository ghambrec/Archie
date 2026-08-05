import { Injectable, Logger } from '@nestjs/common';
import { Client, BucketItemStat } from 'minio';
import { randomUUID } from 'crypto';

@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private readonly client: Client;
  private readonly bucketName: string;

  constructor() {
    const host = process.env.MINIO_HOST ?? '127.0.0.1';
    const port = Number(process.env.MINIO_PORT ?? '9000');
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const accessKey = process.env.MINIO_APP_ACCESS_KEY;
    const secretKey = process.env.MINIO_APP_SECRET_KEY;
    const bucket = process.env.MINIO_BUCKET ?? 'avatar';

    if (!accessKey || !secretKey) {
      throw new Error('MinIO credentials are not configured. Set MINIO_APP_ACCESS_KEY and MINIO_APP_SECRET_KEY.');
    }

    this.bucketName = bucket;
    this.client = new Client({
      endPoint: host,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    void this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
      }
    } catch (error) {
      this.logger.warn(`Unable to ensure MinIO bucket ${this.bucketName}: ${error}`);
    }
  }

  async uploadUserAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    const objectKey = `users/${userId}/avatar-${randomUUID()}${this.getExtension(file.originalname)}`;
    await this.client.putObject(
      this.bucketName,
      objectKey,
      file.buffer,
      file.buffer.length,
      {
        'Content-Type': file.mimetype,
      },
    );
    return objectKey;
  }

  async getObject(objectKey: string): Promise<NodeJS.ReadableStream> {
    return this.client.getObject(this.bucketName, objectKey);
  }

  async statObject(objectKey: string): Promise<BucketItemStat> {
    return this.client.statObject(this.bucketName, objectKey);
  }

  private getExtension(filename: string): string {
    const match = filename.match(/\.[0-9a-zA-Z]+$/);
    return match ? match[0] : '';
  }
}
