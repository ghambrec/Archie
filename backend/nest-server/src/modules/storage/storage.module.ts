import { Module } from '@nestjs/common';
import { MinioModule } from './minio/minio.module';

@Module({
  imports: [MinioModule]
})
export class StorageModule {}
