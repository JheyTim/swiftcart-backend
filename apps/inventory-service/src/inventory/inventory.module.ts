import { RabbitMqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryItem } from './inventory-item.entity';
import { InventoryService } from './inventory.service';
import { StockReservation } from './stock-reservation.entity';

// InventoryModule groups inventory routes, repositories, and business logic.
@Module({
  imports: [
    // Makes InventoryItem and StockReservation repositories injectable.
    TypeOrmModule.forFeature([InventoryItem, StockReservation]),
    // Provides RabbitMQ channel and publisher.
    RabbitMqModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
