import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ChannelModel } from 'amqplib';
import { EventName } from '../events';
import { RABBITMQ_CHANNEL, RABBITMQ_CONNECTION } from './rabbitmq.constants';

// RabbitMqPublisher publishes domain events to RabbitMQ.
// Services use this instead of dealing with amqplib directly.
@Injectable()
export class RabbitMqPublisher implements OnModuleDestroy {
  constructor(
    // Shared AMQP connection created by RabbitMqModule.
    @Inject(RABBITMQ_CONNECTION)
    private readonly connection: ChannelModel,

    // Shared AMQP channel created by RabbitMqModule.
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,

    // Reads RabbitMQ exchange name from environment variables.
    private readonly configService: ConfigService,
  ) {}

  // Publish one event to the shared topic exchange.
  async publish<TPayload extends object>(
    eventName: EventName,
    payload: TPayload,
    correlationId?: string,
  ) {
    const exchange = this.configService.get<string>('RABBITMQ_EXCHANGE') || '';

    // Wrap event data with useful metadata.
    const message = {
      eventName,
      payload,
      metadata: {
        // Event timestamp helps with debugging and ordering analysis.
        occurredAt: new Date().toISOString(),
        correlationId,
      },
    };

    // Convert the event object into a Buffer because RabbitMQ sends bytes.
    const buffer = Buffer.from(JSON.stringify(message));

    // Publish to the topic exchange using eventName as the routing key.
    // persistent=true tells RabbitMQ to persist messages to disk when queues are durable.
    const accepted = this.channel.publish(exchange, eventName, buffer, {
      contentType: 'application/json',
      persistent: true,
      correlationId,
    });

    // channel.publish returns false when the write buffer is full.
    // For this learning milestone, we log it. Later, we can add backpressure handling.
    if (!accepted) {
      console.warn(`RabbitMQ publish buffer is full for event: ${eventName}`);
    }
  }

  // Close RabbitMQ resources when the NestJS app shuts down.
  async onModuleDestroy() {
    await this.channel.close();
    await this.connection.close();
  }
}
