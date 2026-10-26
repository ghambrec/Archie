import { Injectable } from '@nestjs/common';
import { Histogram, Registry } from '@prometheus-io/client';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly chatDuration = new Histogram({
    name: 'archie_chat_request_duration_seconds',
    help: 'Server processing time of chat requests, including AI service latency and unsuccessful requests.',
    buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 60, 120, 180, 300, 600],
    registers: [this.registry],
  });

  get contentType(): string {
    return this.registry.contentType;
  }

  startChatRequest(): () => number {
    return this.chatDuration.startTimer();
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }
}
