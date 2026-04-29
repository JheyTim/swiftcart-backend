import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  // Create the Product Service NestJS application.
  const app = await NestFactory.create(AppModule);

  // Validate all incoming request bodies using DTO decorators.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Read the configured service port from .env.
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PRODUCT_SERVICE_PORT') ?? 3002;

  await app.listen(port);
}
bootstrap();
