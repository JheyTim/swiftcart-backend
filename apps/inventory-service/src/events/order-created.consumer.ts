import {
  EventNames,
  OrderCreatedEvent,
  RABBITMQ_CHANNEL,
  DomainEventMessage,
  rejectMessageWithRetry,
  setupConsumerQueue,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';
import { InventoryService } from '../inventory/inventory.service';

// This consumer listens for order.created and tries to reserve stock.
@Injectable()
export class OrderCreatedConsumer implements OnModuleInit {
  // Queue name is specific to Inventory Service's order-created handler.
  private readonly queueName = 'inventory.order-created';
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
      routingKey: EventNames.OrderCreated,
      deadLetterExchange: this.deadLetterExchange,
      retryExchange,
      retryDelayMs: 5000,
    });

    // Consume with manual acknowledgement.
    await this.channel.consume(
      this.queueName,
      (message) => this.handleMessage(message),
      { noAck: false },
    );

    console.log(`Inventory Service listening for ${EventNames.OrderCreated}`);
  }

  private async handleMessage(message: ConsumeMessage | null) {
    if (!message) {
      return;
    }

    try {
      const parsedMessage = JSON.parse(
        message.content.toString(),
      ) as DomainEventMessage<OrderCreatedEvent>;

      // Delegate business logic to InventoryService.
      await this.inventoryService.reserveStockForOrder(parsedMessage.payload);

      // Acknowledge after successful reservation handling.
      this.channel.ack(message);
    } catch (error) {
      console.error(
        'Failed to handle order.created in Inventory Service:',
        error,
      );

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
