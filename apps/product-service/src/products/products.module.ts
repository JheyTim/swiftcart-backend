import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '../redis/redis.module';
import { Product } from './product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

// ProductsModule groups product database access, routes, and business logic.
@Module({
  imports: [
    // Makes Product repository injectable inside this module.
    TypeOrmModule.forFeature([Product]),

    // Provides Redis client for caching product reads.
    RedisModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
