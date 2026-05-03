// These statuses describe the order lifecycle.
// We start with PENDING because inventory and payment are not processed yet.
export enum OrderStatus {
  Pending = 'PENDING',
  // Inventory has been reserved, but payment has not completed yet.
  InventoryReserved = 'INVENTORY_RESERVED',

  // Inventory reservation failed, so the order cannot continue.
  Cancelled = 'CANCELLED',
  
  // These will be used in Milestone 7.
  Paid = 'PAID',
  PaymentFailed = 'PAYMENT_FAILED',
}
