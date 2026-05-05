import {
  DomainEventMessage,
  EventNames,
  PaymentSucceededEvent,
  RABBITMQ_CHANNEL,
  rejectMessageWithRetry,
  setupConsumerQueue,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';
import { InventoryService } from '../inventory/inventory.service';
// This consumer confirms reserved stock after successful payment.
@Injectable()
export class PaymentSucceededConsumer implements OnModuleInit {
  private readonly queueName = 'inventory.payment-succeeded';
  private deadLetterExchange = '';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
    private readonly inventoryService: InventoryService,
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
      routingKey: EventNames.PaymentSucceeded,
      deadLetterExchange: this.deadLetterExchange,
      retryExchange,
      retryDelayMs: 5000,
    });

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
      const parsedMessage = JSON.parse(
        message.content.toString(),
      ) as DomainEventMessage<PaymentSucceededEvent>;

      await this.inventoryService.confirmReservationForOrder(
        parsedMessage.payload.orderId,
      );

      this.channel.ack(message);
    } catch (error) {
      console.error(
        'Failed to handle payment.succeeded in Inventory Service:',
        error,
      );

      // Reject without requeue to avoid infinite retry loops.
      rejectMessageWithRetry({
        channel: this.channel,
        message,
        deadLetterExchange: this.deadLetterExchange,
        routingKey: EventNames.PaymentSucceeded,
        maxRetries: 3,
      });
    }
  }
}
