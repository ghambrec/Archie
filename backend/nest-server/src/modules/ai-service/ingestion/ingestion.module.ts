import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import aiServiceConfig from 'src/config/ai-service.config';
import { IngestionService } from './ingestion.service';

@Module({
	imports: [ConfigModule.forFeature(aiServiceConfig)],
	providers: [IngestionService],
	exports: [IngestionService]
})
export class IngestionModule {}
