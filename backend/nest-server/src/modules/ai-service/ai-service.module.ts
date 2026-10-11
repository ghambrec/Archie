import { Module } from '@nestjs/common';
import { IngestionModule } from './ingestion/ingestion.module';
import { ConversationsModule } from './conversations/conversations.module';

@Module({
  imports: [IngestionModule, ConversationsModule],
  exports: [IngestionModule, ConversationsModule],
})
export class AiServiceModule {}
