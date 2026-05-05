import { createPostgresTypeOrmAsyncOptions } from '@app/common/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from './events/events.module';
import { InventoryItem } from './inventory/inventory-item.entity';
import { InventoryModule } from './inventory/inventory.module';
import { StockReservation } from './inventory/stock-reservation.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(
      createPostgresTypeOrmAsyncOptions([InventoryItem, StockReservation]),
    ),
    InventoryModule,
    EventsModule,
  ],
})
export class AppModule {}
