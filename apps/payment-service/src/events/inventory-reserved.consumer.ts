import {
  DomainEventMessage,
  EventNames,
  InventoryReservedEvent,
  RABBITMQ_CHANNEL,
  rejectMessageWithRetry,
  setupConsumerQueue,
} from '@app/common';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ConsumeMessage } from 'amqplib';
import { PaymentsService } from '../payments/payments.service';
// This consumer listens for inventory.reserved and starts payment processing.
@Injectable()
export class InventoryReservedConsumer implements OnModuleInit {
  // Queue name is specific to Payment Service's inventory-reserved handler.
  private readonly queueName = 'payment.inventory-reserved';
  private deadLetterExchange = '';

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: Channel,
    private readonly configService: ConfigService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async onModuleInit() {
    const exchange = this.configService.get<string>('RABBITMQ_EXCHANGE') || '';
    this.deadLetterExchange =
      this.configService.get<string>('RABBITMQ_DEAD_LETTER_EXCHANGE') || '';
    const retryExchange =
      this.configService.get<string>('RABBITMQ_RETRY_EXCHANGE') || '';

    await setupConsumerQueue({
      channel: this.channel,
      queueName: this.queueName,
      exchange,
      routingKey: EventNames.InventoryReserved,
      deadLetterExchange: this.deadLetterExchange,
      retryExchange,
      retryDelayMs: 5000,
    });

    // Consume with manual acknowledgement.
    await this.channel.consume(
      this.queueName,
      (message) => this.handleMessage(message),
      { noAck: false },
    );
    console.log(`Payment Service listening for ${EventNames.InventoryReserved}
`);
  }

  private async handleMessage(message: ConsumeMessage | null) {
    if (!message) {
      return;
    }

    try {
      const parsedMessage = JSON.parse(
        message.content.toString(),
      ) as DomainEventMessage<InventoryReservedEvent>;

      // Delegate payment business logic to PaymentsService.
      await this.paymentsService.processPaymentForReservedInventory(
        parsedMessage.payload,
      );

      // Acknowledge only after payment result event is published.
      this.channel.ack(message);
    } catch (error) {
      console.error(
        'Failed to process inventory.reserved in Payment Service:',
        error,
      );

      // Reject without requeue to avoid infinite retry loops.
      rejectMessageWithRetry({
        channel: this.channel,
        message,
        deadLetterExchange: this.deadLetterExchange,
        routingKey: EventNames.InventoryReserved,
        maxRetries: 3,
      });
    }
  }
}
