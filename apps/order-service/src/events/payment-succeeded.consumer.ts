import {
  EventNames,
  PaymentSucceededEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';
import { OrdersService } from '../orders/orders.service';

// This consumer marks orders as paid after payment succeeds.
@Injectable()
export class PaymentSucceededConsumer implements OnModuleInit {
  private readonly queueName = 'order.payment-succeeded';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  async onModuleInit() {
    await consumeDomainEvent<PaymentSucceededEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.PaymentSucceeded,
      logMessage: `Order Service listening for ${EventNames.PaymentSucceeded}`,
      errorMessage: 'Failed to handle payment.succeeded:',
      handleEvent: async (event) => {
        await this.ordersService.markPaid(event.payload.orderId);
      },
    });
  }
}
