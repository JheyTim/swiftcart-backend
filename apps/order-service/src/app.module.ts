import { createPostgresTypeOrmAsyncOptions } from '@app/common/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from './events/events.module';
import { OrderItem } from './orders/order-item.entity';
import { Order } from './orders/order.entity';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(createPostgresTypeOrmAsyncOptions([Order, OrderItem])),
    OrdersModule,
    EventsModule,
  ],
})
export class AppModule {}
