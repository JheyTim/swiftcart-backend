// This event is published when a simulated payment succeeds.
export type PaymentSucceededEvent = {
  orderId: string;
  userId: string;
  paymentId: string;
  amountCents: number;
  paidAt: string;
};

// This event is published when a simulated payment fails.
export type PaymentFailedEvent = {
  orderId: string;
  userId: string;
  paymentId: string;
  amountCents: number;
  reason: string;
  failedAt: string;
};
