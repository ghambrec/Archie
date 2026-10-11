import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';
import aiServiceConfig from 'src/config/ai-service.config';

@Injectable()
export class IngestionService {
  constructor(
    @Inject(aiServiceConfig.KEY)
    private readonly config: ConfigType<typeof aiServiceConfig>,
    private readonly logger: Logger,
  ) {}

  async triggerIngestion(documentId: string): Promise<void> {
    const url = `http://${this.config.host}:${this.config.port}/ingest/${documentId}`;

	let response: Response;
	try {
		response = await fetch(url, { method: 'POST', headers: { 'X-API-KEY': this.config.apiKey }, });	
	} catch (error) {
		this.logger.error({ documentId, error }, 'AI Service unavailable');
		throw new ApplicationException(ErrorCode.AiServiceUnavailable);
	}

    if (!response.ok) {
      this.logger.error(
        { documentId, status: response.status },
        'AI service rejected ingestion request',
      );
      throw new ApplicationException(ErrorCode.AiServiceUnavailable);
    }

    this.logger.log({ documentId }, 'Ingestion job queued');
  }
}
