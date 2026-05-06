import {
  EventNames,
  PaymentFailedEvent,
  RABBITMQ_CHANNEL,
  consumeDomainEvent,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel } from 'amqplib';
import { OrdersService } from '../orders/orders.service';

// This consumer marks orders as payment failed after payment fails.
@Injectable()
export class PaymentFailedConsumer implements OnModuleInit {
  private readonly queueName = 'order.payment-failed';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  async onModuleInit() {
    await consumeDomainEvent<PaymentFailedEvent>({
      channel: this.channel,
      configService: this.configService,
      queueName: this.queueName,
      routingKey: EventNames.PaymentFailed,
      logMessage: `Order Service listening for ${EventNames.PaymentFailed}`,
      errorMessage: 'Failed to handle payment.failed:',
      handleEvent: async (event) => {
        await this.ordersService.markPaymentFailed(event.payload.orderId);
      },
    });
  }
}
