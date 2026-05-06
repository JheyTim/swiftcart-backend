import {
  EventNames,
  PaymentFailedEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';

// This consumer logs failed payment notifications.
@Injectable()
export class PaymentFailedConsumer implements OnModuleInit {
  private readonly queueName = 'notification.payment-failed';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await consumeDomainEvent<PaymentFailedEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.PaymentFailed,
      logMessage: `Listening for ${EventNames.PaymentFailed} on queue ${this.queueName}`,
      errorMessage: 'Failed to process payment.failed notification:',
      handleEvent: (event) => {
        console.log('Notification Service received payment.failed event:', {
          orderId: event.payload.orderId,
          paymentId: event.payload.paymentId,
          reason: event.payload.reason,
        });
      },
    });
  }
}
