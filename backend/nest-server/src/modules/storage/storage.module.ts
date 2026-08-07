import { Module } from '@nestjs/common';
import { MinioModule } from './minio/minio.module';
import { StorageService } from './storage.service';

@Module({
  imports: [MinioModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
