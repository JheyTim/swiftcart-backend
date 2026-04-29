import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthProxyService } from './auth/auth-proxy.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { ProductsController } from './products/products.controller';
import { ProductsProxyService } from './products/products-proxy.service';
import { ProfileController } from './profile.controller';

// Root module for the API Gateway.
@Module({
  imports: [
    
    // Loads .env variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Allows the gateway to call internal services over HTTP.
    HttpModule,

    // Enables Passport JWT validation.
    PassportModule,
  ],
  controllers: [
    // Existing health controller.
    AppController,

    // Public auth proxy endpoints.
    AuthController,

    // Protected route example.
    ProfileController,

    // Product Controller
    ProductsController,
  ],
  providers: [AppService, AuthProxyService, ProductsProxyService, JwtStrategy],
})
export class AppModule {}
