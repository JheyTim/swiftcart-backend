import {
  CorrelationIdMiddleware,
  RequestLoggingMiddleware,
  envValidationSchema,
  createPostgresTypeOrmModule,
} from '@app/common';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    createPostgresTypeOrmModule([Product]),

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
