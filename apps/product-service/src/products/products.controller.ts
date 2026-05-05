import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Headers,
} from '@nestjs/common';
import { CORRELATION_ID_HEADER } from '@app/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

// This controller exposes Product Service HTTP routes.
// These routes are internal in spirit, because clients should call through the API Gateway.
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Creates a product.
  @Post()
  create(
    @Headers(CORRELATION_ID_HEADER) correlationId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(createProductDto, correlationId);
  }

  // Lists all products.
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // Reads one product by ID.
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // Updates one product by ID.
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }
}
