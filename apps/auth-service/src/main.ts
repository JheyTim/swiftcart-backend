import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  // Create the Auth Service NestJS application.
  const app = await NestFactory.create(AppModule);

  // ValidationPipe automatically validates incoming DTOs.
  // whitelist removes fields that are not defined in the DTO class.
  // transform converts primitive values when possible.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ConfigService reads values from environment variables and .env files.
  const configService = app.get(ConfigService);

  // The Auth Service runs on its own port so the API Gateway can call it.
  const port = configService.get<number>('AUTH_SERVICE_PORT') ?? 3001;

  await app.listen(port);
}
bootstrap();
