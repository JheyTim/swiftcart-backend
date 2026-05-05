import {
  EventNames,
  PaymentSucceededEvent,
  RABBITMQ_CHANNEL,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';

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
    const exchange =
      this.configService.get<string>('RABBITMQ_EXCHANGE') ?? 'swiftcart.events';

    await this.channel.assertQueue(this.queueName, { durable: true });

    await this.channel.bindQueue(
      this.queueName,
      exchange,
      EventNames.PaymentSucceeded,
    );

    await this.channel.consume(
      this.queueName,
      (message) => this.handleMessage(message),
      {
        noAck: false,
      },
    );
  }

  private async handleMessage(message: ConsumeMessage | null) {
    if (!message) {
      return;
    }

    try {
      const parsedMessage = JSON.parse(message.content.toString()) as {
        payload: PaymentSucceededEvent;
      };

      console.log('Notification Service received payment.succeeded event:', {
        orderId: parsedMessage.payload.orderId,
        paymentId: parsedMessage.payload.paymentId,
      });

      this.channel.ack(message);
    } catch (error) {
      console.error('Failed to process payment.succeeded notification:', error);
      this.channel.nack(message, false, false);
    }
  }
}
