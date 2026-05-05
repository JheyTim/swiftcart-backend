import type { RequestWithCorrelationId } from '@app/common';
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddStockDto } from './dto/add-stock.dto';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { InventoryProxyService } from './inventory-proxy.service';

// This controller exposes inventory management routes from the API Gateway.
// For now, any logged-in user can call these routes.
// Later, we should add roles so only admins can manage stock.
@Controller('inventory/items')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryProxyService: InventoryProxyService) {}
  @Post()
  create(
    @Req() request: RequestWithCorrelationId,
    @Body() createDto: CreateInventoryItemDto,
  ) {
    return this.inventoryProxyService.create(createDto, request.correlationId);
  }

  @Get()
  findAll(@Req() request: RequestWithCorrelationId) {
    return this.inventoryProxyService.findAll(request.correlationId);
  }

  @Get(':productId')
  findByProductId(
    @Req() request: RequestWithCorrelationId,
    @Param('productId') productId: string,
  ) {
    return this.inventoryProxyService.findByProductId(
      productId,
      request.correlationId,
    );
  }

  @Patch(':productId/add-stock')
  addStock(
    @Req() request: RequestWithCorrelationId,
    @Param('productId') productId: string,
    @Body() addStockDto: AddStockDto,
  ) {
    return this.inventoryProxyService.addStock(
      productId,
      addStockDto,
      request.correlationId,
    );
  }
}
