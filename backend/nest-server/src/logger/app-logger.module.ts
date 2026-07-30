import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';


@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get('NODE_ENV') === 'development';
        return {
          pinoHttp: {
            level: isDev ? 'debug' : 'info',
            // Dev: pretty-printed, colourised, single-line
            // Prod: raw JSON (no transport = stdout JSON)
            transport: isDev
              ? {
                  target: 'pino-pretty',
                  options: { colorize: true, singleLine: true },
                }
              : undefined,
            // Never log sensitive headers into your storage
            redact: ['req.headers.authorization', 'req.headers.cookie'],
            // genReqId: () => randomUUID(), // Just if we like this
            // Control exactly which request/response fields are logged
            serializers: {
              req: (req) => ({
                method: req.method,
                url: req.url,
                requestId: req.id,
              }),
              res: (res) => ({
                statusCode: res.statusCode,
              }),
            },
          },
        };
      },
    }),
  ],
})
export class AppLoggerModule {}

