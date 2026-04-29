import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

// API Gateway validates product creation before forwarding it to Product Service.
export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(5)
  description!: string;

  @IsInt()
  @Min(1)
  priceCents!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
