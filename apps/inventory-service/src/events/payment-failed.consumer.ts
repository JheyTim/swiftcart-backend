import {
  EventNames,
  PaymentFailedEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';
import { InventoryService } from '../inventory/inventory.service';

// This consumer releases reserved stock after payment failure.
@Injectable()
export class PaymentFailedConsumer implements OnModuleInit {
  private readonly queueName = 'inventory.payment-failed';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
    private readonly inventoryService: InventoryService,
  ) {}

  async onModuleInit() {
    await consumeDomainEvent<PaymentFailedEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.PaymentFailed,
      logMessage: `Inventory Service listening for ${EventNames.PaymentFailed}`,
      errorMessage: 'Failed to handle payment.failed in Inventory Service:',
      handleEvent: async (event) => {
        await this.inventoryService.releaseReservationForOrder(
          event.payload.orderId,
        );
      },
    });
  }
}
