import { GlobalHttpExceptionFilter } from '@app/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create the Order Service NestJS application.
  const app = await NestFactory.create(AppModule);

  // Enables graceful shutdown hooks for SIGTERM/SIGINT.
  // This is important for Docker and Kubernetes.
  app.enableShutdownHooks();

  // Validate incoming request bodies with DTO decorators.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Standard error response shape for all unhandled exceptions.
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // Read configured port from .env.
  const configService = app.get(ConfigService);

  const port = configService.get<number>('ORDER_SERVICE_PORT') || '';

  await app.listen(port);
}
bootstrap();
