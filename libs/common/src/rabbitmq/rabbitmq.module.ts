import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { RABBITMQ_CHANNEL, RABBITMQ_CONNECTION } from './rabbitmq.constants';
import { RabbitMqPublisher } from './rabbitmq-publisher.service';

// RabbitMqModule creates and exports shared RabbitMQ infrastructure.
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RABBITMQ_CONNECTION,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const rabbitMqUrl = configService.get<string>('RABBITMQ_URL');

        if (!rabbitMqUrl) {
          throw new Error('RABBITMQ_URL is required');
        }

        // Create one TCP connection to RabbitMQ.
        // Channels will use this connection to publish or consume messages.
        return amqp.connect(rabbitMqUrl);
      },
    },
    {
      provide: RABBITMQ_CHANNEL,
      inject: [RABBITMQ_CONNECTION, ConfigService],
      useFactory: async (
        connection: amqp.ChannelModel,
        configService: ConfigService,
      ) => {
        const exchange = configService.get<string>('RABBITMQ_EXCHANGE') || '';

        const deadLetterExchange =
          configService.get<string>('RABBITMQ_DEAD_LETTER_EXCHANGE') ??
          'swiftcart.dead-letter';

        const retryExchange =
          configService.get<string>('RABBITMQ_RETRY_EXCHANGE') ??
          'swiftcart.retry';

        // Create a channel. Most RabbitMQ operations happen on channels.
        const channel = await connection.createChannel();

        // Create the shared topic exchange if it does not already exist.
        // durable=true keeps the exchange after RabbitMQ restarts.
        await channel.assertExchange(exchange, 'topic', {
          durable: true,
        });

        // Dead-letter exchange receives messages that cannot be processed.
        await channel.assertExchange(deadLetterExchange, 'topic', {
          durable: true,
        });

        // Retry exchange receives messages that should be retried after a delay.
        await channel.assertExchange(retryExchange, 'topic', {
          durable: true,
        });

        return channel;
      },
    },
    RabbitMqPublisher,
  ],
  exports: [RABBITMQ_CONNECTION, RABBITMQ_CHANNEL, RabbitMqPublisher],
})
export class RabbitMqModule {}
