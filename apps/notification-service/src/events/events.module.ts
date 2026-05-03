import { RabbitMqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { InventoryReservationFailedConsumer } from './inventory-reservation-failed.consumer';
import { InventoryReservedConsumer } from './inventory-reserved.consumer';
import { OrderCreatedConsumer } from './order-created.consumer';
import { ProductCreatedConsumer } from './product-created.consumer';

// EventsModule groups all RabbitMQ consumers for the Notification Service.
@Module({
  // Provides RabbitMQ connection/channel so this service can consume events.
  imports: [RabbitMqModule],
  providers: [
    ProductCreatedConsumer,
    OrderCreatedConsumer,
    InventoryReservedConsumer,
    InventoryReservationFailedConsumer,
  ],
})
export class EventsModule {}
