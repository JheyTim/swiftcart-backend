import {
  EventNames,
  InventoryReservedEvent,
  RABBITMQ_CHANNEL,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';
import { OrdersService } from '../orders/orders.service';
// This consumer updates orders after inventory is successfully reserved.
@Injectable()
export class InventoryReservedConsumer implements OnModuleInit {
  private readonly queueName = 'order.inventory-reserved';
  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}
  async onModuleInit() {
    const exchange =
      this.configService.get<string>('RABBITMQ_EXCHANGE') ?? 'swiftcart.events';
    await this.channel.assertQueue(this.queueName, { durable: true });
    await this.channel.bindQueue(
      this.queueName,
      exchange,
      EventNames.InventoryReserved,
    );
    await this.channel.consume(
      this.queueName,
      (message) => this.handleMessage(message),
      { noAck: false },
    );
    console.log(`Order Service listening for ${EventNames.InventoryReserved}`);
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
      await this.ordersService.markInventoryReserved(
        parsedMessage.payload.orderId,
      );
      this.channel.ack(message);
    } catch (error) {
      console.error('Failed to handle inventory.reserved:', error);
      this.channel.nack(message, false, false);
    }
  }
}
