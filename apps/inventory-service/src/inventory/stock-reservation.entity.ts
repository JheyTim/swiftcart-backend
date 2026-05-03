import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

// Each row records that stock was reserved for a specific order item.
// This helps us release or confirm stock later when payment succeeds or fails.
@Entity({ name: 'stock_reservations' })
export class StockReservation {
  // UUID for this reservation row.
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Order ID from Order Service.
  @Column({ name: 'order_id' })
  orderId!: string;

  // User ID from the order event.
  @Column({ name: 'user_id' })
  userId!: string;

  // Product ID being reserved.
  @Column({ name: 'product_id' })
  productId!: string;

  // Quantity reserved for this product.
  @Column({ type: 'int' })
  quantity!: number;

  // Status lets us track whether this reservation is still active later.
  @Column({ default: 'RESERVED' })
  status!: 'RESERVED' | 'RELEASED' | 'CONFIRMED';

  // Timestamp for auditing.
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
