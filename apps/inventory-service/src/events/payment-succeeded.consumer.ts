import {
  EventNames,
  PaymentSucceededEvent,
  RABBITMQ_CHANNEL,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';
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
    const exchange =
      this.configService.get<string>('RABBITMQ_EXCHANGE') ?? 'swiftcart.events';

    await this.channel.assertQueue(this.queueName, { durable: true });

    await this.channel.bindQueue(
      this.queueName,
      exchange,
      EventNames.PaymentSucceeded,
    );

    await this.channel.consume(
      this.queueName,
      (message) => this.handleMessage(message),
      { noAck: false },
    );

    console.log(`Inventory Service listening for ${EventNames.PaymentSucceeded}
`);
  }
  private async handleMessage(message: ConsumeMessage | null) {
    if (!message) {
      return;
    }
    try {
      const parsedMessage = JSON.parse(message.content.toString()) as {
        payload: PaymentSucceededEvent;
      };

      await this.inventoryService.confirmReservationForOrder(
        parsedMessage.payload.orderId,
      );

      this.channel.ack(message);
    } catch (error) {
      console.error(
        'Failed to handle payment.succeeded in Inventory Service:',
        error,
      );
      this.channel.nack(message, false, false);
    }
  }
}
