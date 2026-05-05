import { createPostgresTypeOrmAsyncOptions } from '@app/common/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './products/product.entity';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(createPostgresTypeOrmAsyncOptions([Product])),
    ProductsModule,
  ],
})
export class AppModule {}
