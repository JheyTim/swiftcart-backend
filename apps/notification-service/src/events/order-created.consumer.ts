import { EventNames, OrderCreatedEvent, RABBITMQ_CHANNEL } from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';

// This consumer listens for order.created events.
// It simulates notifying the customer that their order was received.
@Injectable()
export class OrderCreatedConsumer implements OnModuleInit {
  // Queue name is specific to the Notification Service's order-created handler.
  private readonly queueName = 'notification.order-created';
  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const exchange =
      this.configService.get<string>('RABBITMQ_EXCHANGE') ?? 'swiftcart.events';

    // Create the queue if it does not exist.
    await this.channel.assertQueue(this.queueName, {
      durable: true,
    });

    // Bind this queue to order.created events only.
    await this.channel.bindQueue(
      this.queueName,
      exchange,
      EventNames.OrderCreated,
    );

    // Start consuming messages with manual acknowledgement.
    await this.channel.consume(
      this.queueName,
      (message) => this.handleMessage(message),
      {
        noAck: false,
      },
    );

    console.log(`Listening for ${EventNames.OrderCreated} on queue $
{this.queueName}`);
  }

  private async handleMessage(message: ConsumeMessage | null) {
    if (!message) {
      return;
    }
    try {
      const parsedMessage = JSON.parse(message.content.toString()) as {
        eventName: string;
        payload: OrderCreatedEvent;
        metadata: {
          occurredAt: string;
        };
      };

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

      // Reject without requeue to avoid infinite retry loops for bad messages.
      this.channel.nack(message, false, false);
    }
  }
}
