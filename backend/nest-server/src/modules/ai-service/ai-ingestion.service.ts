import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import aiServiceConfig from 'src/config/ai-service.config';

@Injectable()
export class AiIngestionService {
  constructor(
    @Inject(aiServiceConfig.KEY)
    private readonly config: ConfigType<typeof aiServiceConfig>,
    private readonly logger: Logger,
  ) {}

  async triggerIngestion(documentId: string): Promise<void> {
    const url = `http://${this.config.host}:${this.config.port}/ingest/${documentId}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'X-API-KEY': this.config.apiKey },
      });

      if (!response.ok) {
        this.logger.error(
          { documentId, status: response.status },
          'AI service rejected ingestion request',
        );
        return;
      }

      this.logger.log({ documentId }, 'Ingestion job queued');
    } catch (error) {
      this.logger.error({ documentId, error }, 'Failed to reach AI service for ingestion');
    }
  }
}
