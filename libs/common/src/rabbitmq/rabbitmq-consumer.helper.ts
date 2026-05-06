import { ConfigService } from '@nestjs/config';
import { Channel, ConsumeMessage } from 'amqplib';
import { DomainEventMessage, EventName } from '../events';
import { getConsumerBrokerConfig } from './consumer-config.helper';

// Options used to configure a RabbitMQ consumer queue.
export type RabbitMqConsumerOptions = {
  channel: Channel;
  queueName: string;
  exchange: string;
  routingKey: string;
  deadLetterExchange: string;
  retryExchange: string;
  retryDelayMs?: number;
};

export type ConsumeDomainEventOptions<TPayload extends object> = {
  channel: Channel;
  configService: ConfigService;
  queueName: string;
  routingKey: EventName;
  handleEvent: (event: DomainEventMessage<TPayload>) => Promise<void> | void;
  logMessage: string;
  errorMessage: string;
  retryDelayMs?: number;
  maxRetries?: number;
};

// Creates a durable queue with retry and dead-letter behavior.
export async function setupConsumerQueue(options: RabbitMqConsumerOptions) {
  const retryDelayMs = options.retryDelayMs ?? 5000;

  // Main queue receives messages from the main domain exchange.
  await options.channel.assertQueue(options.queueName, {
    durable: true,
    deadLetterExchange: options.retryExchange,
    deadLetterRoutingKey: options.routingKey,
  });

  // Retry queue delays failed messages before sending them back to the main exchange.
  await options.channel.assertQueue(`${options.queueName}.retry`, {
    durable: true,
    messageTtl: retryDelayMs,
    deadLetterExchange: options.exchange,
    deadLetterRoutingKey: options.routingKey,
  });

  // Dead-letter queue stores messages that should no longer be retried.
  await options.channel.assertQueue(`${options.queueName}.dead-letter`, {
    durable: true,
  });

  // Bind the main queue to the main exchange.
  await options.channel.bindQueue(
    options.queueName,
    options.exchange,
    options.routingKey,
  );

  // Bind retry queue to retry exchange.
  await options.channel.bindQueue(
    `${options.queueName}.retry`,
    options.retryExchange,
    options.routingKey,
  );

  // Bind dead-letter queue to dead-letter exchange.
  await options.channel.bindQueue(
    `${options.queueName}.dead-letter`,
    options.deadLetterExchange,
    options.routingKey,
  );
}

export async function consumeDomainEvent<TPayload extends object>(
  options: ConsumeDomainEventOptions<TPayload>,
) {
  const { exchange, deadLetterExchange, retryExchange } =
    getConsumerBrokerConfig(options.configService);

  await setupConsumerQueue({
    channel: options.channel,
    queueName: options.queueName,
    exchange,
    routingKey: options.routingKey,
    deadLetterExchange,
    retryExchange,
    retryDelayMs: options.retryDelayMs,
  });

  await options.channel.consume(
    options.queueName,
    (message) => handleDomainEventMessage(message, options, deadLetterExchange),
    { noAck: false },
  );

  console.log(options.logMessage);
}

async function handleDomainEventMessage<TPayload extends object>(
  message: ConsumeMessage | null,
  options: ConsumeDomainEventOptions<TPayload>,
  deadLetterExchange: string,
) {
  if (!message) {
    return;
  }

  try {
    const parsedMessage = JSON.parse(
      message.content.toString(),
    ) as DomainEventMessage<TPayload>;

    await options.handleEvent(parsedMessage);

    options.channel.ack(message);
  } catch (error) {
    console.error(options.errorMessage, error);

    rejectMessageWithRetry({
      channel: options.channel,
      message,
      deadLetterExchange,
      routingKey: options.routingKey,
      maxRetries: options.maxRetries,
    });
  }
}

// Sends a failed message either to retry or dead-letter.
export function rejectMessageWithRetry(options: {
  channel: Channel;
  message: ConsumeMessage;
  deadLetterExchange: string;
  routingKey: string;
  maxRetries?: number;
}) {
  const maxRetries = options.maxRetries ?? 3;

  // RabbitMQ x-death header tracks how many times a message has died in queues.
  const deathHeader = options.message.properties.headers?.['x-death'] as
    | Array<{ count: number }>
    | undefined;

  const retryCount = deathHeader?.[0]?.count ?? 0;

  if (retryCount >= maxRetries) {
    // Publish to dead-letter exchange after too many retries.
    options.channel.publish(
      options.deadLetterExchange,
      options.routingKey,
      options.message.content,
      {
        contentType: options.message.properties.contentType,
        persistent: true,
        correlationId: options.message.properties.correlationId,
      },
    );

    // Acknowledge original message because we manually copied it to deadletter.
    options.channel.ack(options.message);

    return;
  }
  // Reject without requeue.
  // Queue dead-letter settings will route it to the retry exchange.
  options.channel.nack(options.message, false, false);
}
