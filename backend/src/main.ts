import 'dotenv/config'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
//   app.enableCors({
// 	origin: 'http://localhost:4200'
//   });
  app.useGlobalPipes(
	new ValidationPipe({
		whitelist: true,
		forbidNonWhitelisted: true,
		transform: true
	})
  );

  const config = new DocumentBuilder()
  	.setTitle('Archie API')
	.setDescription('API documentation for the archie project')
	.setVersion('0.1')
	.addBearerAuth()
	.addServer('/api')
	.build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory, {
	swaggerOptions: {
		persistAuthorization: true,
		    // defaultModelsExpandDepth: -1, // hides Schemas section
	}
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
