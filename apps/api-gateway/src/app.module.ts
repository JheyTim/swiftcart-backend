import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// The root module wires together controllers and providers for the API Gateway app.
@Module({
  // Controllers define HTTP routes.
  controllers: [AppController],

  // Providers contain injectable logic used by controllers or other services.
  providers: [AppService],
})
export class AppModule {}
