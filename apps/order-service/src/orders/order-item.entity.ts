import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

// Entity tells TypeORM that this class maps to the order_items table.
// Each row represents one product line inside an order.
@Entity({ name: 'order_items' })
export class OrderItem {
  // UUID gives every order item its own unique ID.
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Many order items belong to one order.
  // onDelete CASCADE deletes items if their parent order is deleted.
  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  order!: Order;

  // Product ID references a product owned by Product Service.
  // We do not create a database foreign key across service-owned tables.
  @Column({ name: 'product_id' })
  productId!: string;

  // Quantity ordered for this product.
  @Column({ type: 'int' })
  quantity!: number;

  // Price at the time of ordering.
  // This protects historical orders if the product price changes later.
  @Column({ name: 'unit_price_cents', type: 'int' })
  unitPriceCents!: number;

  // Snapshot of product name at the time of ordering.
  // This protects historical orders if the product name changes later.
  @Column({ name: 'product_name' })
  productName!: string;
}
