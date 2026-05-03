import { RabbitMqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { InventoryReservationFailedConsumer } from './inventory-reservation-failed.consumer';
import { InventoryReservedConsumer } from './inventory-reserved.consumer';

// EventsModule groups RabbitMQ consumers for Order Service.
@Module({
  imports: [OrdersModule, RabbitMqModule],
  providers: [InventoryReservedConsumer, InventoryReservationFailedConsumer],
})
export class EventsModule {}
