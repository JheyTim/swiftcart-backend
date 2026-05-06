import {
  EventNames,
  InventoryReservationFailedEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';
import { OrdersService } from '../orders/orders.service';

// This consumer cancels orders when inventory reservation fails.
@Injectable()
export class InventoryReservationFailedConsumer implements OnModuleInit {
  private readonly queueName = 'order.inventory-reservation-failed';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  async onModuleInit() {
    await consumeDomainEvent<InventoryReservationFailedEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.InventoryReservationFailed,
      logMessage: `Order Service listening for ${EventNames.InventoryReservationFailed}`,
      errorMessage: 'Failed to handle inventory.reservation_failed:',
      handleEvent: async (event) => {
        await this.ordersService.cancelForInventoryFailure(
          event.payload.orderId,
        );
      },
    });
  }
}
