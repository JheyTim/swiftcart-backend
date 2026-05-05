import { EventNames, OrderCreatedEvent, RabbitMqPublisher } from '@app/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './enums/order-status.enum';
import { OrderItem } from './order-item.entity';
import { Order } from './order.entity';

// OrdersService contains order business logic.
@Injectable()
export class OrdersService {
  constructor(
    // Repository for the orders table.
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,

    // Repository for order_items table.
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,

    // Shared RabbitMQ publisher from libs/common.
    private readonly rabbitMqPublisher: RabbitMqPublisher,
  ) {}

  // Creates a new order for the authenticated user.
  async create(
    userId: string,
    createOrderDto: CreateOrderDto,
    correlationId: string,
  ) {
    // Calculate the order total from item snapshots.
    // Formula: total = sum(unit price * quantity)
    const totalPriceCents = createOrderDto.items.reduce((sum, item) => {
      return sum + item.unitPriceCents * item.quantity;
    }, 0);

    // Convert DTO items into OrderItem entities.
    const orderItems = createOrderDto.items.map((item) =>
      this.orderItemsRepository.create({
        productId: item.productId,
        productName: item.productName,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
      }),
    );

    // Create the parent Order entity.
    const order = this.ordersRepository.create({
      userId,
      status: OrderStatus.Pending,
      totalPriceCents,
      items: orderItems,
    });

    // Save order and items to PostgreSQL.
    // Because Order.items uses cascade=true, items are saved with the order.
    const savedOrder = await this.ordersRepository.save(order);

    // Build event payload for downstream services.
    const eventPayload: OrderCreatedEvent = {
      orderId: savedOrder.id,
      userId: savedOrder.userId,
      totalPriceCents: savedOrder.totalPriceCents,
      items: savedOrder.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      })),
      createdAt: savedOrder.createdAt.toISOString(),
    };

    // Publish order.created only after the database write succeeds.
    await this.rabbitMqPublisher.publish(
      EventNames.OrderCreated,
      eventPayload,
      correlationId,
    );
    return savedOrder;
  }

  // Lists orders for the authenticated user.
  async findAllForUser(userId: string) {
    return this.ordersRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Reads one order by ID for the authenticated user.
  async findOneForUser(userId: string, orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  // Marks an order as inventory reserved.
  async markInventoryReserved(orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    // Only pending orders should move to inventory reserved.
    if (order.status !== OrderStatus.Pending) {
      return order;
    }
    order.status = OrderStatus.InventoryReserved;
    return this.ordersRepository.save(order);
  }
  // Cancels an order because inventory reservation failed.
  async cancelForInventoryFailure(orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    // Only pending orders should be cancelled by inventory failure.
    if (order.status !== OrderStatus.Pending) {
      return order;
    }
    order.status = OrderStatus.Cancelled;
    return this.ordersRepository.save(order);
  }

  // Marks an order as paid after payment succeeds.
  async markPaid(orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only orders with reserved inventory should become paid.
    if (order.status !== OrderStatus.InventoryReserved) {
      return order;
    }

    order.status = OrderStatus.Paid;
    return this.ordersRepository.save(order);
  }
  // Marks an order as payment failed after payment fails.
  async markPaymentFailed(orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only orders with reserved inventory should become payment failed.
    if (order.status !== OrderStatus.InventoryReserved) {
      return order;
    }

    order.status = OrderStatus.PaymentFailed;
    return this.ordersRepository.save(order);
  }
}
