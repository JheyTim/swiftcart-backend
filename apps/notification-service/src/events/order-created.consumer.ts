import {
  EventNames,
  OrderCreatedEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';

// This consumer listens for order.created events.
// It simulates notifying the customer that their order was received.
@Injectable()
export class OrderCreatedConsumer implements OnModuleInit {
  private readonly queueName = 'notification.order-created';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await consumeDomainEvent<OrderCreatedEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.OrderCreated,
      logMessage: `Listening for ${EventNames.OrderCreated} on queue ${this.queueName}`,
      errorMessage: 'Failed to process order.created event:',
      handleEvent: (event) => {
        console.log('Notification Service received order.created event:', {
          orderId: event.payload.orderId,
          userId: event.payload.userId,
          totalPriceCents: event.payload.totalPriceCents,
          itemCount: event.payload.items.length,
          occurredAt: event.metadata.occurredAt,
        });
      },
    });
  }
}
