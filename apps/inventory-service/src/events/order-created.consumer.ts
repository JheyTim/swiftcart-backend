import { EventNames, OrderCreatedEvent, RABBITMQ_CHANNEL } from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';
import { InventoryService } from '../inventory/inventory.service';

// This consumer listens for order.created and tries to reserve stock.
@Injectable()
export class OrderCreatedConsumer implements OnModuleInit {
  // Queue name is specific to Inventory Service's order-created handler.
  private readonly queueName = 'inventory.order-created';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
    private readonly inventoryService: InventoryService,
  ) {}

  async onModuleInit() {
    const exchange =
      this.configService.get<string>('RABBITMQ_EXCHANGE') ?? 'swiftcart.events';

    // Create queue if it does not already exist.
    await this.channel.assertQueue(this.queueName, {
      durable: true,
    });

    // Bind to order.created events only.
    await this.channel.bindQueue(
      this.queueName,
      exchange,
      EventNames.OrderCreated,
    );

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
      const parsedMessage = JSON.parse(message.content.toString()) as {
        eventName: string;
        payload: OrderCreatedEvent;
        metadata: {
          occurredAt: string;
        };
      };

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
      this.channel.nack(message, false, false);
    }
  }
}
