import { Module } from '@nestjs/common';
import { MetricsModule } from '../../metrics/metrics.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConfigModule } from '@nestjs/config';
import aiServiceConfig from 'src/config/ai-service.config';
import { SessionModule } from 'src/modules/auth/session/session.module';

@Module({
	imports: [ConfigModule.forFeature(aiServiceConfig), SessionModule, MetricsModule],
	controllers: [ConversationsController],
	providers: [ConversationsService],
	exports: [ConversationsService]
})
export class ConversationsModule {}
