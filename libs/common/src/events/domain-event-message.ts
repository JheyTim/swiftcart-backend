import { EventName } from './event-names';

// Standard wrapper for all domain events sent through RabbitMQ.
export type DomainEventMessage<TPayload> = {
  eventName: EventName;
  payload: TPayload;
  metadata: {
    occurredAt: string;
    correlationId?: string;
    retryCount?: number;
  };
};
