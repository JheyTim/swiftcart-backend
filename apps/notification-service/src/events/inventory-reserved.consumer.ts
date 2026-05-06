import {
  EventNames,
  InventoryReservedEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';

// This consumer logs inventory reservation success notifications.
@Injectable()
export class InventoryReservedConsumer implements OnModuleInit {
  private readonly queueName = 'notification.inventory-reserved';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
  ) {}
  async onModuleInit() {
    await consumeDomainEvent<InventoryReservedEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.InventoryReserved,
      logMessage: `Listening for ${EventNames.InventoryReserved} on queue ${this.queueName}`,
      errorMessage: 'Failed to process inventory.reserved notification:',
      handleEvent: (event) => {
        console.log('Notification Service received inventory.reserved event:', {
          orderId: event.payload.orderId,
          reservationId: event.payload.reservationId,
        });
      },
    });
  }
}
