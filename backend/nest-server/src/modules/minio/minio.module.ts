import { Global, Module } from '@nestjs/common';
import { Client } from 'minio';
import { getEnv, getEnvBoolean, getEnvNumber, requireEnv } from '../../common/env/env';

export const MINIO_CLIENT = 'MINIO_CLIENT';

const DEFAULT_MINIO_ENDPOINT = 'minio';
const DEFAULT_MINIO_PORT = 9000;
const DEFAULT_MINIO_USE_SSL = false;

@Global()
@Module({
  providers: [
    {
      provide: MINIO_CLIENT,
      useFactory: () => {
        return new Client({
          endPoint: getEnv('MINIO_ENDPOINT', DEFAULT_MINIO_ENDPOINT),
          port: getEnvNumber('MINIO_PORT', DEFAULT_MINIO_PORT),
          useSSL: getEnvBoolean('MINIO_USE_SSL', DEFAULT_MINIO_USE_SSL),
          accessKey: requireEnv('MINIO_APP_ACCESS_KEY'),
          secretKey: requireEnv('MINIO_APP_SECRET_KEY'),
        });
      },
    },
  ],
  exports: [MINIO_CLIENT],
})
export class MinioModule {}
