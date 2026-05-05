import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  // Create the Payment Service NestJS application.
  const app = await NestFactory.create(AppModule);

  // Read configured port from .env.
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PAYMENT_SERVICE_PORT') ?? 3006;

  // Payment Service mostly consumes RabbitMQ events.
  // HTTP listening is useful for health checks and local debugging.
  await app.listen(port);
}
bootstrap();
