import { RabbitMqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from './order-item.entity';
import { Order } from './order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

// OrdersModule groups order routes, database repositories, and business logic.
@Module({
  imports: [
    // Makes Order and OrderItem repositories injectable.
    TypeOrmModule.forFeature([Order, OrderItem]),

    // Provides RabbitMQ connection/channel so this service can consume events.
    RabbitMqModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  // Export OrdersService so event consumers can update order statuses.
  exports: [OrdersService],
})
export class OrdersModule {}
