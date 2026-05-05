import {
  DomainEventMessage,
  EventNames,
  OrderCreatedEvent,
  RABBITMQ_CHANNEL,
  rejectMessageWithRetry,
  setupConsumerQueue,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';

// This consumer listens for order.created events.
// It simulates notifying the customer that their order was received.
@Injectable()
export class OrderCreatedConsumer implements OnModuleInit {
  // Queue name is specific to the Notification Service's order-created handler.
  private readonly queueName = 'notification.order-created';
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
      routingKey: EventNames.OrderCreated,
      deadLetterExchange: this.deadLetterExchange,
      retryExchange,
      retryDelayMs: 5000,
    });

    // Start consuming messages with manual acknowledgement.
    await this.channel.consume(
      this.queueName,
      (message) => this.handleMessage(message),
      {
        noAck: false,
      },
    );

    console.log(
      `Listening for ${EventNames.OrderCreated} on queue ${this.queueName}`,
    );
  }

  private async handleMessage(message: ConsumeMessage | null) {
    if (!message) {
      return;
    }
    try {
      const parsedMessage = JSON.parse(
        message.content.toString(),
      ) as DomainEventMessage<OrderCreatedEvent>;

      // Simulate sending an order confirmation notification.
      console.log('Notification Service received order.created event:', {
        orderId: parsedMessage.payload.orderId,
        userId: parsedMessage.payload.userId,
        totalPriceCents: parsedMessage.payload.totalPriceCents,
        itemCount: parsedMessage.payload.items.length,
        occurredAt: parsedMessage.metadata.occurredAt,
      });

      // Acknowledge only after successful handling.
      this.channel.ack(message);
    } catch (error) {
      console.error('Failed to process order.created event:', error);

      // Reject without requeue to avoid infinite retry loops.
      rejectMessageWithRetry({
        channel: this.channel,
        message,
        deadLetterExchange: this.deadLetterExchange,
        routingKey: EventNames.OrderCreated,
        maxRetries: 3,
      });
    }
  }
}
