// This object contains all domain event names used across services.
// Keeping event names in one shared place avoids typo bugs like 'product.created' vs 'products.created'.
export const EventNames = {
  ProductCreated: 'product.created',
  OrderCreated: 'order.created',
  InventoryReserved: 'inventory.reserved',
  InventoryReservationFailed: 'inventory.reservation_failed',
  PaymentSucceeded: 'payment.succeeded',
  PaymentFailed: 'payment.failed',
} as const;

// This type becomes a union of all event-name string values.
// Example: 'product.created' | 'order.created' | ...
export type EventName = (typeof EventNames)[keyof typeof EventNames];
