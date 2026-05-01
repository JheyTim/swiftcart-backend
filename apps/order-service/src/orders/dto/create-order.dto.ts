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
  // Product ID should come from Product Service.
  @IsString()
  productId!: string;

  // Product name snapshot is included for now to keep this milestone simple.
  // Later, the Order Service can call Product Service to verify product
  @IsString()
  productName!: string;

  // Unit price snapshot is included for now.
  // Later, the Order Service should verify this against Product Service.
  @IsInt()
  @Min(1)
  unitPriceCents!: number;

  // Quantity must be at least 1.
  @IsInt()
  @Min(1)
  quantity!: number;
}

// Request body for creating an order.
export class CreateOrderDto {
  // An order must contain at least one item.
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
