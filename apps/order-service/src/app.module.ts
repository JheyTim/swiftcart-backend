import {
  CorrelationIdMiddleware,
  RequestLoggingMiddleware,
  envValidationSchema,
  createPostgresTypeOrmModule,
} from '@app/common';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events/events.module';
import { OrderItem } from './orders/order-item.entity';
import { Order } from './orders/order.entity';
import { OrdersModule } from './orders/orders.module';
import { HealthModule } from './health/health.module';

// Root module for the Order Service.
@Module({
  imports: [
    // Loads environment variables from .env.
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    // Connects Order Service to PostgreSQL.
    createPostgresTypeOrmModule([Order, OrderItem]),

    // Order feature module.
    OrdersModule,

    EventsModule,

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
