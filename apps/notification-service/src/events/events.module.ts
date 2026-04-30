import { RabbitMqModule } from '@app/common';

import { Module } from '@nestjs/common';
import { ProductCreatedConsumer } from './product-created.consumer';

// EventsModule groups all RabbitMQ consumers for the Notification Service.
@Module({
  imports: [
    // Provides RabbitMQ connection/channel so this service can consume events.
    RabbitMqModule,
  ],
  providers: [ProductCreatedConsumer],
})
export class EventsModule {}
