import { RabbitMqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { OrderCreatedConsumer } from './order-created.consumer';
import { PaymentFailedConsumer } from './payment-failed.consumer';
import { PaymentSucceededConsumer } from './payment-succeeded.consumer';

// EventsModule groups RabbitMQ consumers for Inventory Service.
@Module({
  imports: [InventoryModule, RabbitMqModule],
  providers: [
    OrderCreatedConsumer,
    PaymentSucceededConsumer,
    PaymentFailedConsumer,
  ],
})
export class EventsModule {}
