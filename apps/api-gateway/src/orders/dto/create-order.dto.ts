import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// One item inside an order creation request.
export class CreateOrderItemDto {
  @IsString()
  productId!: string;

  @IsString()
  productName!: string;

  @IsInt()
  @Min(1)
  unitPriceCents!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}
// API Gateway validates order requests before forwarding them to Order Service.
export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
