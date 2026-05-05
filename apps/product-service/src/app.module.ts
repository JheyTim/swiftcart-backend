import {
  CorrelationIdMiddleware,
  RequestLoggingMiddleware,
  envValidationSchema,
} from '@app/common';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './products/product.entity';
import { ProductsModule } from './products/products.module';
import { HealthModule } from './health/health.module';

// Root module for the Product Service.
@Module({
  imports: [
    // Loads .env variables and makes ConfigService available globally.
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    // Connects Product Service to PostgreSQL.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: Number(configService.get<number>('POSTGRES_PORT')),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        entities: [Product],
        // Local learning convenience only.
        // In production, use TypeORM migrations instead.
        synchronize: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // Product feature module.
    ProductsModule,

    HealthModule,
  ],
})
export class AppModule implements NestModule {
  // Middleware runs before controllers.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
