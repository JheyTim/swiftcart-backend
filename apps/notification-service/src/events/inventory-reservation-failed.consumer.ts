import {
  DomainEventMessage,
  EventNames,
  InventoryReservationFailedEvent,
  RABBITMQ_CHANNEL,
  rejectMessageWithRetry,
  setupConsumerQueue,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';
// This consumer logs inventory reservation failure notifications.
@Injectable()
export class InventoryReservationFailedConsumer implements OnModuleInit {
  private readonly queueName = 'notification.inventory-reservation-failed';
  private deadLetterExchange = '';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
  ) {}
  async onModuleInit() {
    const exchange = this.configService.get<string>('RABBITMQ_EXCHANGE') || '';
    this.deadLetterExchange =
      this.configService.get<string>('RABBITMQ_DEAD_LETTER_EXCHANGE') || '';
    const retryExchange =
      this.configService.get<string>('RABBITMQ_RETRY_EXCHANGE') || '';

    await setupConsumerQueue({
      channel: this.channel,
      queueName: this.queueName,
      exchange,
      routingKey: EventNames.InventoryReservationFailed,
      deadLetterExchange: this.deadLetterExchange,
      retryExchange,
      retryDelayMs: 5000,
    });

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
      const parsedMessage = JSON.parse(
        message.content.toString(),
      ) as DomainEventMessage<InventoryReservationFailedEvent>;

      console.log(
        'Notification Service received inventory.reservation_failed event:',
        {
          orderId: parsedMessage.payload.orderId,
          reason: parsedMessage.payload.reason,
          failedItems: parsedMessage.payload.failedItems,
        },
      );
      this.channel.ack(message);
    } catch (error) {
      console.error(
        'Failed to process inventory.reservation_failed notification:',
        error,
      );

      // Reject without requeue to avoid infinite retry loops.
      rejectMessageWithRetry({
        channel: this.channel,
        message,
        deadLetterExchange: this.deadLetterExchange,
        routingKey: EventNames.InventoryReservationFailed,
        maxRetries: 3,
      });
    }
  }
}
