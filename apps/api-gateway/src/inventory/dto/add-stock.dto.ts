import { IsInt, Min } from 'class-validator';
// API Gateway validates stock additions before forwarding to Inventory Service.
export class AddStockDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}
