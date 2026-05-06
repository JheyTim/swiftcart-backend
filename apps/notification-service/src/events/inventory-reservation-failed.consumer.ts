import {
  EventNames,
  InventoryReservationFailedEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';

// This consumer logs inventory reservation failure notifications.
@Injectable()
export class InventoryReservationFailedConsumer implements OnModuleInit {
  private readonly queueName = 'notification.inventory-reservation-failed';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await consumeDomainEvent<InventoryReservationFailedEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.InventoryReservationFailed,
      logMessage: `Listening for ${EventNames.InventoryReservationFailed} on queue ${this.queueName}`,
      errorMessage:
        'Failed to process inventory.reservation_failed notification:',
      handleEvent: (event) => {
        console.log(
          'Notification Service received inventory.reservation_failed event:',
          {
            orderId: event.payload.orderId,
            reason: event.payload.reason,
            failedItems: event.payload.failedItems,
          },
        );
      },
    });
  }
}
