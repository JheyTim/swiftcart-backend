import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from './enums/order-status.enum';
import { OrderItem } from './order-item.entity';

// Entity tells TypeORM that this class maps to the orders table.
// The Order Service owns this table.
@Entity({ name: 'orders' })
export class Order {
  // UUID gives every order a globally unique ID.
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // User ID comes from the JWT validated by the API Gateway.
  // We store the ID only; Auth Service owns the actual user table.
  @Column({ name: 'user_id' })
  userId!: string;

  // Order starts as PENDING until inventory and payment complete in later milestones.
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  status!: OrderStatus;

  // Total is stored in cents to avoid floating-point money bugs.
  @Column({ name: 'total_price_cents', type: 'int' })
  totalPriceCents!: number;

  // One order has many line items.
  // cascade inserts order items when the order is saved
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items!: OrderItem[];

  // Created timestamp is useful for sorting and auditing.
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
  // Updated timestamp changes whenever the order changes.
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
