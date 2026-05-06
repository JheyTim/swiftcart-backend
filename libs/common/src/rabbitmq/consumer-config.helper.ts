import { ConfigService } from '@nestjs/config';

export type ConsumerBrokerConfig = {
  exchange: string;
  deadLetterExchange: string;
  retryExchange: string;
};

export function getConsumerBrokerConfig(
  configService: ConfigService,
): ConsumerBrokerConfig {
  return {
    exchange: configService.get<string>('RABBITMQ_EXCHANGE') || '',
    deadLetterExchange:
      configService.get<string>('RABBITMQ_DEAD_LETTER_EXCHANGE') || '',
    retryExchange: configService.get<string>('RABBITMQ_RETRY_EXCHANGE') || '',
  };
}
