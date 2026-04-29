import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  // Create the API Gateway application.
  const app = await NestFactory.create(AppModule);

  // Enable validation for incoming API Gateway requests.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ConfigService reads values from .env.
  const configService = app.get(ConfigService);

  // API Gateway defaults to port 3000.
  const port = configService.get<number>('API_GATEWAY_PORT') ?? 3000;

  await app.listen(port);
}
bootstrap();
