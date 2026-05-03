import {
  EventNames,
  InventoryReservationFailedEvent,
  RABBITMQ_CHANNEL,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';
import { OrdersService } from '../orders/orders.service';
// This consumer cancels orders when inventory reservation fails.
@Injectable()
export class InventoryReservationFailedConsumer implements OnModuleInit {
  private readonly queueName = 'order.inventory-reservation-failed';
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
      EventNames.InventoryReservationFailed,
    );
    await this.channel.consume(
      this.queueName,
      (message) => this.handleMessage(message),
      { noAck: false },
    );
    console.log(`Order Service listening for ${EventNames.InventoryReservationFailed}`);
  }
  private async handleMessage(message: ConsumeMessage | null) {
    if (!message) {
      return;
    }
    try {
      const parsedMessage = JSON.parse(message.content.toString()) as {
        eventName: string;
        payload: InventoryReservationFailedEvent;
        metadata: { occurredAt: string };
      };
      await this.ordersService.cancelForInventoryFailure(
        parsedMessage.payload.orderId,
      );
      this.channel.ack(message);
    } catch (error) {
      console.error('Failed to handle inventory.reservation_failed:', error);
      this.channel.nack(message, false, false);
    }
  }
}
