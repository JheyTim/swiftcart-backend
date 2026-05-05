import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AddStockDto } from '@app/common';
import { CreateInventoryItemDto } from '@app/common';
import { InventoryService } from './inventory.service';

// This controller exposes Inventory Service HTTP routes.
// API Gateway calls these routes after JWT validation.
@Controller('inventory/items')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}
  // Creates inventory for one product.
  @Post()
  create(@Body() createDto: CreateInventoryItemDto) {
    return this.inventoryService.createInventoryItem(createDto);
  }

  // Lists all inventory items.
  @Get()
  findAll() {
    return this.inventoryService.findAll();
  }

  // Reads inventory for one product ID.
  @Get(':productId')
  findByProductId(@Param('productId') productId: string) {
    return this.inventoryService.findByProductId(productId);
  }

  // Adds stock to one product inventory row.
  @Patch(':productId/add-stock')
  addStock(
    @Param('productId') productId: string,
    @Body() addStockDto: AddStockDto,
  ) {
    return this.inventoryService.addStock(productId, addStockDto);
  }
}
