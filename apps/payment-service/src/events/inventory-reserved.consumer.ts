import {
  EventNames,
  InventoryReservedEvent,
  RABBITMQ_CHANNEL,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';
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
    const exchange =
      this.configService.get<string>('RABBITMQ_EXCHANGE') ?? 'swiftcart.events';
    // Create durable queue if it does not exist.
    await this.channel.assertQueue(this.queueName, { durable: true });

    // Bind to inventory.reserved events only.
    await this.channel.bindQueue(
      this.queueName,
      exchange,
      EventNames.InventoryReserved,
    );

    // Consume with manual acknowledgement.
    await this.channel.consume(
      this.queueName,
      (message) => this.handleMessage(message),
      { noAck: false },
    );
    console.log(`Payment Service listening for ${EventNames.InventoryReserved}
`);
  }

  private async handleMessage(message: ConsumeMessage | null) {
    if (!message) {
      return;
    }

    try {
      const parsedMessage = JSON.parse(message.content.toString()) as {
        eventName: string;
        payload: InventoryReservedEvent;
        metadata: { occurredAt: string };
      };

      // Delegate payment business logic to PaymentsService.
      await this.paymentsService.processPaymentForReservedInventory(
        parsedMessage.payload,
      );

      // Acknowledge only after payment result event is published.
      this.channel.ack(message);
    } catch (error) {
      console.error(
        'Failed to process inventory.reserved in Payment Service:',
        error,
      );
      this.channel.nack(message, false, false);
    }
  }
}
