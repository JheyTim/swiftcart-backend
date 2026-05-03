import {
  EventNames,
  InventoryReservedEvent,
  RABBITMQ_CHANNEL,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';
// This consumer logs inventory reservation success notifications.
@Injectable()
export class InventoryReservedConsumer implements OnModuleInit {
  private readonly queueName = 'notification.inventory-reserved';
  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
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
      {
        noAck: false,
      },
    );
  }
  private async handleMessage(message: ConsumeMessage | null) {
    if (!message) {
      return;
    }
    try {
      const parsedMessage = JSON.parse(message.content.toString()) as {
        payload: InventoryReservedEvent;
      };

      console.log('Notification Service received inventory.reserved event:', {
        orderId: parsedMessage.payload.orderId,
        reservationId: parsedMessage.payload.reservationId,
      });
      this.channel.ack(message);
    } catch (error) {
      console.error(
        'Failed to process inventory.reserved notification:',
        error,
      );
      this.channel.nack(message, false, false);
    }
  }
}
