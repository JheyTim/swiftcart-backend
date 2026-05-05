import { RabbitMqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { InventoryReservedConsumer } from './inventory-reserved.consumer';

// EventsModule groups RabbitMQ consumers for Payment Service.
@Module({
  imports: [PaymentsModule, RabbitMqModule],
  providers: [InventoryReservedConsumer],
})
export class EventsModule {}
