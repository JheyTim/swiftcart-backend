import {
  CorrelationIdMiddleware,
  RequestLoggingMiddleware,
  envValidationSchema,
} from '@app/common';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from './events/events.module';
import { Payment } from './payments/payment.entity';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';

// Root module for the Payment Service.
@Module({
  imports: [
    // Loads .env variables.
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    // Connects Payment Service to PostgreSQL.
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
        entities: [Payment],
        // Local learning convenience only.
        // In production, use migrations instead.
        synchronize: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // Payment HTTP routes and business logic.
    PaymentsModule,

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
