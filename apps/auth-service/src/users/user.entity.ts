import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
// Entity tells TypeORM that this class maps to a database table.
// This table is owned by the Auth Service.
@Entity({ name: 'users' })
export class User {
  // UUIDs are better than incremental IDs for public-facing systems
  // because they are harder to guess.
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Email must be unique because users log in with email.
  @Column({ unique: true })
  email!: string;

  // This stores the hashed password, never the plain password.
  // We intentionally do not expose this field in API responses.
  @Column({ name: 'password_hash' })
  passwordHash!: string;

  // User display name.
  @Column({ name: 'full_name' })
  fullName!: string;

  // Created timestamp is useful for auditing and debugging.
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Updated timestamp changes whenever the row is updated.
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
