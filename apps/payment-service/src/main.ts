import { GlobalHttpExceptionFilter } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  // Create the Payment Service NestJS application.
  const app = await NestFactory.create(AppModule);

  // Enables graceful shutdown hooks for SIGTERM/SIGINT.
  // This is important for Docker and Kubernetes.
  app.enableShutdownHooks();

  // Standard error response shape for all unhandled exceptions.
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // Read configured port from .env.
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PAYMENT_SERVICE_PORT') || '';

  // Payment Service mostly consumes RabbitMQ events.
  // HTTP listening is useful for health checks and local debugging.
  await app.listen(port);
}
bootstrap();
