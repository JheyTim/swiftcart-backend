import {
  EventNames,
  InventoryReservedEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';
import { PaymentsService } from '../payments/payments.service';

// This consumer listens for inventory.reserved and starts payment processing.
@Injectable()
export class InventoryReservedConsumer implements OnModuleInit {
  // Queue name is specific to Payment Service's inventory-reserved handler.
  private readonly queueName = 'payment.inventory-reserved';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async onModuleInit() {
    await consumeDomainEvent<InventoryReservedEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.InventoryReserved,
      logMessage: `Payment Service listening for ${EventNames.InventoryReserved}`,
      errorMessage: 'Failed to process inventory.reserved in Payment Service:',
      handleEvent: async (event) => {
        await this.paymentsService.processPaymentForReservedInventory(
          event.payload,
        );
      },
    });
  }
}
