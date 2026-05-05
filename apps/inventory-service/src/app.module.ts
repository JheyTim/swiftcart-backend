import {
  CorrelationIdMiddleware,
  RequestLoggingMiddleware,
  envValidationSchema,
} from '@app/common';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
        entities: [InventoryItem, StockReservation],
        // Local learning convenience only.
        // In production, use migrations instead.
        synchronize: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    // Inventory HTTP routes and business logic.
    InventoryModule,
    // RabbitMQ consumers.
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
