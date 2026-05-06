import {
  EventNames,
  ProductCreatedEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';

// This consumer listens for product.created events.
// In this milestone, it only logs a fake notification.
@Injectable()
export class ProductCreatedConsumer implements OnModuleInit {
  // Queue name is specific to this consumer/service.
  private readonly queueName = 'notification.product-created';

  constructor(
    // Use the shared RabbitMQ channel from the common RabbitMqModule.
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,

    private readonly configService: ConfigService,
  ) {}

  // onModuleInit runs when the NestJS module starts.
  async onModuleInit() {
    await consumeDomainEvent<ProductCreatedEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.ProductCreated,
      logMessage: `Listening for ${EventNames.ProductCreated} on queue ${this.queueName}`,
      errorMessage: 'Failed to process product.created event:',
      handleEvent: (event) => {
        console.log('Notification Service received product.created event:', {
          productId: event.payload.productId,
          name: event.payload.name,
          priceCents: event.payload.priceCents,
          occurredAt: event.metadata.occurredAt,
        });
      },
    });
  }
}
