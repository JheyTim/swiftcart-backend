import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from './events/events.module';
import { Payment } from './payments/payment.entity';
import { PaymentsModule } from './payments/payments.module';

// Root module for the Payment Service.
@Module({
  imports: [
    // Loads .env variables.
    ConfigModule.forRoot({
      isGlobal: true,
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

    // RabbitMQ consumers.
    EventsModule,
  ],
})
export class AppModule {}
