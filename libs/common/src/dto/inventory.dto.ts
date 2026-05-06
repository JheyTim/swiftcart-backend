import { IsInt, IsString, Min } from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(0)
  availableQuantity!: number;
}

export class AddStockDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}
