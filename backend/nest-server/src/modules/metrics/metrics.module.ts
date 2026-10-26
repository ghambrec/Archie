import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { ChatDurationInterceptor } from './chat-duration.interceptor';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, ChatDurationInterceptor],
  exports: [MetricsService, ChatDurationInterceptor],
})
export class MetricsModule {}
