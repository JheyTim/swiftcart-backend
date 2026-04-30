// This payload is published when a product is created.
// It contains only the data other services need, not the entire database row.
export type ProductCreatedEvent = {
  productId: string;
  name: string;
  priceCents: number;
  createdAt: string;
};
