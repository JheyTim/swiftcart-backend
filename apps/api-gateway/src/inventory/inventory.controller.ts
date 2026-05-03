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
  create(@Body() createDto: CreateInventoryItemDto) {
    return this.inventoryProxyService.create(createDto);
  }

  @Get()
  findAll() {
    return this.inventoryProxyService.findAll();
  }

  @Get(':productId')
  findByProductId(@Param('productId') productId: string) {
    return this.inventoryProxyService.findByProductId(productId);
  }

  @Patch(':productId/add-stock')
  addStock(
    @Param('productId') productId: string,
    @Body() addStockDto: AddStockDto,
  ) {
    return this.inventoryProxyService.addStock(productId, addStockDto);
  }
}
