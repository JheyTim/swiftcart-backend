import { IsInt, Min } from 'class-validator';

// This DTO validates adding stock to an existing inventory item.
export class AddStockDto {
  // Quantity to add must be at least 1.
  @IsInt()
  @Min(1)
  quantity!: number;
}
