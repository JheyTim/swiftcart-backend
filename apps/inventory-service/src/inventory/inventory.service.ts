import {
  EventNames,
  InventoryReservationFailedEvent,
  InventoryReservedEvent,
  OrderCreatedEvent,
  RabbitMqPublisher,
} from '@app/common';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AddStockDto } from '@app/common';
import { CreateInventoryItemDto } from '@app/common';
import { InventoryItem } from './inventory-item.entity';
import { StockReservation } from './stock-reservation.entity';

// InventoryService owns stock counts and stock reservations.
@Injectable()
export class InventoryService {
  constructor(
    // Repository for inventory_items table
    @InjectRepository(InventoryItem)
    private readonly inventoryItemsRepository: Repository<InventoryItem>,

    // Repository for stock_reservations table.
    @InjectRepository(StockReservation)
    private readonly stockReservationsRepository: Repository<StockReservation>,

    // DataSource lets us run database transactions.
    private readonly dataSource: DataSource,

    // Publisher emits inventory result events.
    private readonly rabbitMqPublisher: RabbitMqPublisher,
  ) {}

  // Creates inventory for a product.
  async createInventoryItem(createDto: CreateInventoryItemDto) {
    const existingItem = await this.inventoryItemsRepository.findOne({
      where: { productId: createDto.productId },
    });

    if (existingItem) {
      throw new ConflictException('Inventory already exists for this product');
    }

    const item = this.inventoryItemsRepository.create({
      productId: createDto.productId,
      availableQuantity: createDto.availableQuantity,
      reservedQuantity: 0,
    });

    return this.inventoryItemsRepository.save(item);
  }

  // Lists all inventory rows.
  async findAll() {
    return this.inventoryItemsRepository.find({ order: { createdAt: 'DESC' } });
  }

  // Gets inventory by product ID.
  async findByProductId(productId: string) {
    const item = await this.inventoryItemsRepository.findOne({
      where: { productId },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return item;
  }

  // Adds stock to an existing inventory item.
  async addStock(productId: string, addStockDto: AddStockDto) {
    const item = await this.findByProductId(productId);

    item.availableQuantity += addStockDto.quantity;

    return this.inventoryItemsRepository.save(item);
  }

  // Handles order.created event by attempting to reserve stock.
  async reserveStockForOrder(event: OrderCreatedEvent) {
    // Use a database transaction so all item updates succeed or fail together.
    const result = await this.dataSource.transaction(async (manager) => {
      const failedItems: InventoryReservationFailedEvent['failedItems'] = [];
      const reservationRows: StockReservation[] = [];

      // Check every requested item before committing reservation changes.
      for (const orderItem of event.items) {
        const inventoryItem = await manager.findOne(InventoryItem, {
          where: { productId: orderItem.productId },
        });

        if (!inventoryItem) {
          failedItems.push({
            productId: orderItem.productId,
            requestedQuantity: orderItem.quantity,
            availableQuantity: 0,
          });
          continue;
        }

        if (inventoryItem.availableQuantity < orderItem.quantity) {
          failedItems.push({
            productId: orderItem.productId,
            requestedQuantity: orderItem.quantity,
            availableQuantity: inventoryItem.availableQuantity,
          });
        }
      }

      // If any item is unavailable, return failure without changing stock.
      if (failedItems.length > 0) {
        return {
          success: false as const,
          failedItems,
          reservationRows,
        };
      }

      // All items are available, so reserve them.
      for (const orderItem of event.items) {
        const inventoryItem = await manager.findOneOrFail(InventoryItem, {
          where: { productId: orderItem.productId },
        });

        // Move stock from available to reserved.
        inventoryItem.availableQuantity -= orderItem.quantity;
        inventoryItem.reservedQuantity += orderItem.quantity;

        await manager.save(InventoryItem, inventoryItem);

        // Record reservation for later payment success/failure handling.
        const reservation = manager.create(StockReservation, {
          orderId: event.orderId,
          userId: event.userId,
          productId: orderItem.productId,
          quantity: orderItem.quantity,
          status: 'RESERVED',
        });

        const savedReservation = await manager.save(
          StockReservation,
          reservation,
        );

        reservationRows.push(savedReservation);
      }

      return {
        success: true as const,
        failedItems,
        reservationRows,
      };
    });

    if (!result.success) {
      const failedEvent: InventoryReservationFailedEvent = {
        orderId: event.orderId,
        userId: event.userId,
        reason: 'Insufficient stock for one or more products',
        failedItems: result.failedItems,
        failedAt: new Date().toISOString(),
      };
      await this.rabbitMqPublisher.publish(
        EventNames.InventoryReservationFailed,
        failedEvent,
      );
      return;
    }

    const reservedEvent: InventoryReservedEvent = {
      orderId: event.orderId,
      userId: event.userId,
      reservationId: result.reservationRows[0]?.id ?? event.orderId,
      items: event.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      reservedAt: new Date().toISOString(),
    };
    
    await this.rabbitMqPublisher.publish(
      EventNames.InventoryReserved,
      reservedEvent,
    );
  }
}
