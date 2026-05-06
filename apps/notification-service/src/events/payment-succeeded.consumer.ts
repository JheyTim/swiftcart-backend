import {
  EventNames,
  PaymentSucceededEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';

// This consumer logs successful payment notifications.
@Injectable()
export class PaymentSucceededConsumer implements OnModuleInit {
  private readonly queueName = 'notification.payment-succeeded';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await consumeDomainEvent<PaymentSucceededEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.PaymentSucceeded,
      logMessage: `Listening for ${EventNames.PaymentSucceeded} on queue ${this.queueName}`,
      errorMessage: 'Failed to process payment.succeeded notification:',
      handleEvent: (event) => {
        console.log('Notification Service received payment.succeeded event:', {
          orderId: event.payload.orderId,
          paymentId: event.payload.paymentId,
        });
      },
    });
  }
}
