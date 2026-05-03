import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthProxyService } from './auth/auth-proxy.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { InventoryController } from './inventory/inventory.controller';
import { InventoryProxyService } from './inventory/inventory-proxy.service';
import { OrdersController } from './orders/orders.controller';
import { OrdersProxyService } from './orders/orders-proxy.service';
import { ProductsController } from './products/products.controller';
import { ProductsProxyService } from './products/products-proxy.service';
import { ProfileController } from './profile.controller';

// Root module for the API Gateway.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    PassportModule,
  ],
  controllers: [
    AppController,
    AuthController,
    ProfileController,
    ProductsController,
    OrdersController,
    InventoryController,
  ],
  providers: [
    AppService,
    AuthProxyService,
    ProductsProxyService,
    OrdersProxyService,
    InventoryProxyService,
    JwtStrategy,
  ],
})
export class AppModule {}
