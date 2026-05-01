// This payload is published when a customer creates an order.
// Other services use this event to react asynchronously.
export type OrderCreatedEvent = {
  orderId: string;
  userId: string;
  totalPriceCents: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  createdAt: string;
};
