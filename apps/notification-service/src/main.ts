import { GlobalHttpExceptionFilter } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  // Create the Notification Service application.
  const app = await NestFactory.create(AppModule);

  // Enables graceful shutdown hooks for SIGTERM/SIGINT.
  // This is important for Docker and Kubernetes.
  app.enableShutdownHooks();

  // Standard error response shape for all unhandled exceptions.
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  const configService = app.get(ConfigService);

  const port = configService.get<number>('NOTIFICATION_SERVICE_PORT') || '';

  // This service mostly consumes RabbitMQ events.
  // Listening on HTTP is still useful for future health checks.
  await app.listen(port);
}
bootstrap();
