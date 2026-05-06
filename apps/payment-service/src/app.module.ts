import {
  CorrelationIdMiddleware,
  RequestLoggingMiddleware,
  envValidationSchema,
  createPostgresTypeOrmModule,
} from '@app/common';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    createPostgresTypeOrmModule([Payment]),

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
