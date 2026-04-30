import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events/events.module';

// Root module for the Notification Service.
@Module({
  imports: [
    // Loads .env variables for this service.
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Contains event consumers.
    EventsModule,
  ],
})
export class AppModule {}
