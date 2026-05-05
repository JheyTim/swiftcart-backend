import {
  CorrelationIdMiddleware,
  RequestLoggingMiddleware,
  envValidationSchema,
} from '@app/common';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
        entities: [Order, OrderItem],
        // Local learning convenience only.
        // In production, use migrations instead.
        synchronize: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),

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
