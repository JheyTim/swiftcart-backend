import {
  DomainEventMessage,
  EventNames,
  ProductCreatedEvent,
  RABBITMQ_CHANNEL,
  rejectMessageWithRetry,
  setupConsumerQueue,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';

// This consumer listens for product.created events.
// In this milestone, it only logs a fake notification.
@Injectable()
export class ProductCreatedConsumer implements OnModuleInit {
  // Queue name is specific to this consumer/service.
  private readonly queueName = 'notification.product-created';
  private deadLetterExchange = '';

  constructor(
    // Use the shared RabbitMQ channel from the common RabbitMqModule.
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,

    private readonly configService: ConfigService,
  ) {}

  // onModuleInit runs when the NestJS module starts.
  async onModuleInit() {
    const exchange = this.configService.get<string>('RABBITMQ_EXCHANGE') || '';
    this.deadLetterExchange =
      this.configService.get<string>('RABBITMQ_DEAD_LETTER_EXCHANGE') || '';
    const retryExchange =
      this.configService.get<string>('RABBITMQ_RETRY_EXCHANGE') || '';

    // Assert the queue so RabbitMQ creates it if it does not exist.
    // durable=true keeps the queue after RabbitMQ restarts.
    // await this.channel.assertQueue(this.queueName, { durable: true });

    // Bind the queue to the exchange using the product.created routing key.
    // This means this queue receives product.created events only.
    // await this.channel.bindQueue(
    //   this.queueName,
    //   exchange,
    //   EventNames.ProductCreated,
    // );

    await setupConsumerQueue({
      channel: this.channel,
      queueName: this.queueName,
      exchange,
      routingKey: EventNames.ProductCreated,
      deadLetterExchange: this.deadLetterExchange,
      retryExchange,
      retryDelayMs: 5000,
    });

    // Consume messages from the queue.
    // noAck=false means we manually acknowledge after successful processing.
    await this.channel.consume(
      this.queueName,
      (message) => this.handleMessage(message),
      {
        noAck: false,
      },
    );

    console.log(
      `Listening for ${EventNames.ProductCreated} on queue ${this.queueName}`,
    );
  }

  // Handles one RabbitMQ message.
  private async handleMessage(message: ConsumeMessage | null) {
    if (!message) {
      return;
    }

    try {
      // Convert the message body from bytes to an object.
      const parsedMessage = JSON.parse(
        message.content.toString(),
      ) as DomainEventMessage<ProductCreatedEvent>;

      // Simulate notification behavior with a log.
      // Later, this can become email, SMS, push notifications, or webhooks.
      console.log('Notification Service received product.created event:', {
        productId: parsedMessage.payload.productId,
        name: parsedMessage.payload.name,
        priceCents: parsedMessage.payload.priceCents,
        occurredAt: parsedMessage.metadata.occurredAt,
      });

      // Acknowledge only after successful processing.
      this.channel.ack(message);
    } catch (error) {
      console.error('Failed to process product.created event:', error);

      // Reject the message.
      // requeue=false prevents an infinite retry loop for poison messages.
      // Later, we will route failed messages to a dead-letter queue.
      // this.channel.nack(message, false, false);

      // Reject without requeue to avoid infinite retry loops.
      rejectMessageWithRetry({
        channel: this.channel,
        message,
        deadLetterExchange: this.deadLetterExchange,
        routingKey: EventNames.ProductCreated,
        maxRetries: 3,
      });
    }
  }
}
