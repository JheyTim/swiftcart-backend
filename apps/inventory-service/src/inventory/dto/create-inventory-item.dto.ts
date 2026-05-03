import { IsInt, IsString, Min } from 'class-validator';

// This DTO validates requests that create or seed inventory for a product.
export class CreateInventoryItemDto {
  // Product ID should match a product from Product Service.
  @IsString()
  productId!: string;

  // Initial stock must be zero or more.
  @IsInt()
  @Min(0)
  availableQuantity!: number;
}
