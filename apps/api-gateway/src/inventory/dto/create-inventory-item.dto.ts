import { IsInt, IsString, Min } from 'class-validator';
// API Gateway validates inventory creation before forwarding to Inventory Service.
export class CreateInventoryItemDto {
  @IsString()
  productId!: string;
  
  @IsInt()
  @Min(0)
  availableQuantity!: number;
}
