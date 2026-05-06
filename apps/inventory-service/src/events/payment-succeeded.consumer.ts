import {
  EventNames,
  PaymentSucceededEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';
import { InventoryService } from '../inventory/inventory.service';

// This consumer confirms reserved stock after successful payment.
@Injectable()
export class PaymentSucceededConsumer implements OnModuleInit {
  private readonly queueName = 'inventory.payment-succeeded';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
    private readonly inventoryService: InventoryService,
  ) {}

  async onModuleInit() {
    await consumeDomainEvent<PaymentSucceededEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.PaymentSucceeded,
      logMessage: `Inventory Service listening for ${EventNames.PaymentSucceeded}`,
      errorMessage: 'Failed to handle payment.succeeded in Inventory Service:',
      handleEvent: async (event) => {
        await this.inventoryService.confirmReservationForOrder(
          event.payload.orderId,
        );
      },
    });
  }
}
