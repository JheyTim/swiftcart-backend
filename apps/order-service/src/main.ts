import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create the Order Service NestJS application.
  const app = await NestFactory.create(AppModule);

  // Validate incoming request bodies with DTO decorators.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Read configured port from .env.
  const configService = app.get(ConfigService);

  const port = configService.get<number>('ORDER_SERVICE_PORT') ?? 3004;

  await app.listen(port);
}
bootstrap();
