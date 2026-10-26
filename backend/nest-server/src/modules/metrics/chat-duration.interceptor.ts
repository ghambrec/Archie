import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { finalize, Observable } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class ChatDurationInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const stop = this.metrics.startChatRequest();
    return next.handle().pipe(finalize(() => { stop(); }));
  }
}
