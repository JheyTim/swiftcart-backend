import {
  EventNames,
  InventoryReservedEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';
import { OrdersService } from '../orders/orders.service';

// This consumer updates orders after inventory is successfully reserved.
@Injectable()
export class InventoryReservedConsumer implements OnModuleInit {
  private readonly queueName = 'order.inventory-reserved';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  async onModuleInit() {
    await consumeDomainEvent<InventoryReservedEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.InventoryReserved,
      logMessage: `Order Service listening for ${EventNames.InventoryReserved}`,
      errorMessage: 'Failed to handle inventory.reserved:',
      handleEvent: async (event) => {
        await this.ordersService.markInventoryReserved(event.payload.orderId);
      },
    });
  }
}
