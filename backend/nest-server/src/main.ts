import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ApplicationExceptionFilter } from './common/errors/application-exception.filter';



async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useGlobalFilters(new ApplicationExceptionFilter())

  app.useLogger(app.get(Logger));
  
  app.use(cookieParser());

  app.enableCors({
	  origin: 'http://localhost:4200',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );


  const config = new DocumentBuilder()
    .setTitle('Documents System API')
    .setDescription('API documentation for the Documents System backend')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const port = process.env.NEST_SERVER_PORT;
  if (!port) {
    throw new Error('PORT environment variable is not set');
  }

  await app.listen(port);
}
bootstrap();
