import {
  CorrelationIdMiddleware,
  RequestLoggingMiddleware,
  envValidationSchema,
  createPostgresTypeOrmModule,
} from '@app/common';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events/events.module';
import { InventoryItem } from './inventory/inventory-item.entity';
import { InventoryModule } from './inventory/inventory.module';
import { StockReservation } from './inventory/stock-reservation.entity';
import { HealthModule } from './health/health.module';

// Root module for the Inventory Service.
@Module({
  imports: [
    // Loads .env variables.
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    // Connects Inventory Service to PostgreSQL.
    createPostgresTypeOrmModule([InventoryItem, StockReservation]),

    // Inventory HTTP routes and business logic.
    InventoryModule,

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
