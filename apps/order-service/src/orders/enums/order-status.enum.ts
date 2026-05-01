// These statuses describe the order lifecycle.
// We start with PENDING because inventory and payment are not processed yet.
export enum OrderStatus {
  Pending = 'PENDING',
  Canceled = 'CANCELLED',
  Paid = 'PAID',
  PaymentFailed = 'PAYMENT_FAILED',
}
