import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  // Create the Notification Service application.
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const port = configService.get<number>('NOTIFICATION_SERVICE_PORT') ?? 3003;

  // This service mostly consumes RabbitMQ events.
  // Listening on HTTP is still useful for future health checks.
  await app.listen(port);
}
bootstrap();
