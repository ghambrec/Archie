import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import aiServiceConfig from 'src/config/ai-service.config';
import { AiIngestionService } from './ai-ingestion.service';

@Module({
  imports: [ConfigModule.forFeature(aiServiceConfig)],
  providers: [AiIngestionService],
  exports: [AiIngestionService],
})
export class AiServiceModule {}
