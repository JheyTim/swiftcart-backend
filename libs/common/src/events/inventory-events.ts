// This event is published when Inventory Service successfully reserves stock for an order.
export type InventoryReservedEvent = {
  orderId: string;
  userId: string;
  reservationId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  reservedAt: string;
};

// This event is published when Inventory Service cannot reserve stock for an order.
export type InventoryReservationFailedEvent = {
  orderId: string;
  userId: string;
  reason: string;
  failedItems: Array<{
    productId: string;
    requestedQuantity: number;
    availableQuantity: number;
  }>;
  failedAt: string;
};
