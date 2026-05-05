import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from './enums/payment-status.enum';

// Entity tells TypeORM this class maps to the payments table.
// Payment Service owns this table.
@Entity({ name: 'payments' })
export class Payment {
  // UUID for this payment record.
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Order ID from Order Service.
  @Column({ name: 'order_id' })
  orderId!: string;

  // User ID from the inventory.reserved event.
  @Column({ name: 'user_id' })
  userId!: string;

  // Payment amount in cents to avoid floating-point money bugs.
  @Column({ name: 'amount_cents', type: 'int' })
  amountCents!: number;

  // Current payment status.
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.Pending,
  })
  status!: PaymentStatus;

  // Failure reason is null for successful payments.
  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason!: string | null;

  // Timestamp for auditing.
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Timestamp updated whenever payment status changes.
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
