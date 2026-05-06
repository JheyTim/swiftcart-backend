import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import type {
  RequestWithCorrelationId,
  CreateProductDto,
  UpdateProductDto,
} from '@app/common';
import { JwtAuthGuard } from '@app/common';
import { ProductsProxyService } from './products-proxy.service';

// This controller exposes product endpoints from the API Gateway.
// The gateway protects these routes and forwards valid requests to Product Service.
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsProxyService: ProductsProxyService) {}

  // Creates a product. Protected by JWT at the controller level.
  @Post()
  create(
    @Req() request: RequestWithCorrelationId,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsProxyService.create(
      createProductDto,
      request.correlationId,
    );
  }

  // Lists products. Product Service decides whether to read from Redis or PostgreSQL.
  @Get()
  findAll(@Req() request: RequestWithCorrelationId) {
    return this.productsProxyService.findAll(request.correlationId);
  }

  // Gets one product by ID.
  @Get(':id')
  findOne(@Req() request: RequestWithCorrelationId, @Param('id') id: string) {
    return this.productsProxyService.findOne(id, request.correlationId);
  }

  // Updates one product by ID.
  @Patch(':id')
  update(
    @Req() request: RequestWithCorrelationId,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsProxyService.update(
      id,
      updateProductDto,
      request.correlationId,
    );
  }
}
