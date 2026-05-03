import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Entity tells TypeORM this class maps to the inventory_items table.
// Inventory Service owns this table.
@Entity({ name: 'inventory_items' })
export class InventoryItem {
  // UUID for this inventory row
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Product ID comes from Product Service.
  // We do not create cross-service database foreign keys.
  @Column({ name: 'product_id', unique: true })
  productId!: string;

  // Quantity currently available for reservation.
  @Column({ name: 'available_quantity', type: 'int', default: 0 })
  availableQuantity!: number;

  // Quantity currently reserved for pending orders.
  @Column({ name: 'reserved_quantity', type: 'int', default: 0 })
  reservedQuantity!: number;

  // Timestamp for auditing.
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Timestamp updated whenever stock changes.
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
