import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Préfixe global de l'API
  app.setGlobalPrefix('api');

  // Validation globale des DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Configuration CORS
  const corsOrigins = configService.get<string>(
    'CORS_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000',
  );
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Documentation Swagger
  const config = new DocumentBuilder()
    .setTitle('Assembly Management API')
    .setDescription('API de gestion des assemblées, membres et contributions financières')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
  logger.log(`🚀 API démarrée sur http://localhost:${port}`);
  logger.log(`📚 Documentation Swagger : http://localhost:${port}/api/docs`);
}

bootstrap();
