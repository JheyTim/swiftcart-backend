import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Entity tells TypeORM that this class maps to a PostgreSQL table.
// Product data is owned only by the Product Service.
@Entity({ name: 'products' })
export class Product {
  // UUID gives each product a globally unique identifier.
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Product name shown to customers.
  @Column()
  name!: string;

  // Product description gives more detail to customers.
  @Column({ type: 'text' })
  description!: string;

  // Price is stored as an integer in cents to avoid floating-point money bugs.
  // Example: 1299 means $12.99 or ₱12.99 depending on your chosen currency.
  @Column({ name: 'price_cents', type: 'int' })
  priceCents!: number;

  // Product active flag lets us hide products without deleting historical records.
  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  // Created timestamp is useful for sorting and auditing.
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Updated timestamp changes whenever this product is modified.
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
