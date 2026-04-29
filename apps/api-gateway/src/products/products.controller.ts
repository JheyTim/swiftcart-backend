import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsProxyService } from './products-proxy.service';

// This controller exposes product endpoints from the API Gateway.
// The gateway protects these routes and forwards valid requests to Product Service.
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsProxyService: ProductsProxyService) {}

  // Creates a product. Protected by JWT at the controller level.
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsProxyService.create(createProductDto);
  }

  // Lists products. Product Service decides whether to read from Redis or PostgreSQL.
  @Get()
  findAll() {
    return this.productsProxyService.findAll();
  }

  // Gets one product by ID.
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsProxyService.findOne(id);
  }

  // Updates one product by ID.
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsProxyService.update(id, updateProductDto);
  }
}
