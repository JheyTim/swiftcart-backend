import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthProxyService } from './auth/auth-proxy.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { ProfileController } from './profile.controller';

// Root module for the API Gateway.
@Module({
  imports: [
    // Loads .env variables for the API Gateway.
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Enables API Gateway to make HTTP calls to internal services.
    HttpModule,

    // Enables Passport authentication strategies and guards.
    PassportModule,
  ],
  controllers: [
    // Existing health controller.
    AppController,

    // Public auth proxy endpoints.
    AuthController,

    // Protected route example.
    ProfileController,
  ],
  providers: [
    AppService,

    // Handles API Gateway -> Auth Service forwarding.
    AuthProxyService,

    // Validates JWT bearer tokens at the gateway.
    JwtStrategy,
  ],
})
export class AppModule {}
