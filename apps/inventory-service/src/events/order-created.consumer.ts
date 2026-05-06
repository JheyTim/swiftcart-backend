import {
  EventNames,
  OrderCreatedEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';
import { InventoryService } from '../inventory/inventory.service';

// This consumer listens for order.created and tries to reserve stock.
@Injectable()
export class OrderCreatedConsumer implements OnModuleInit {
  private readonly queueName = 'inventory.order-created';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
    private readonly inventoryService: InventoryService,
  ) {}

  async onModuleInit() {
    await consumeDomainEvent<OrderCreatedEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.OrderCreated,
      logMessage: `Inventory Service listening for ${EventNames.OrderCreated}`,
      errorMessage: 'Failed to handle order.created in Inventory Service:',
      handleEvent: async (event) => {
        await this.inventoryService.reserveStockForOrder(event.payload);
      },
    });
  }
}
