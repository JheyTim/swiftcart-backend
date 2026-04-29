import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

// This DTO validates requests for creating products.
export class CreateProductDto {
  // Product name must be readable and not empty.
  @IsString()
  @MinLength(2)
  name!: string;

  // Description explains what the product is.
  @IsString()
  @MinLength(5)
  description!: string;

  // Store money as cents to avoid decimal precision problems.
  @IsInt()
  @Min(1)
  priceCents!: number;

  // Optional flag. If omitted, the entity default is true.
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
