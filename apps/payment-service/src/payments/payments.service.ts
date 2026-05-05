import {
  EventNames,
  InventoryReservedEvent,
  PaymentFailedEvent,
  PaymentSucceededEvent,
  RabbitMqPublisher,
} from '@app/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentStatus } from './enums/payment-status.enum';
import { Payment } from './payment.entity';

//PaymentService owns payment processing logic.
@Injectable()
export class PaymentsService {
  constructor(
    // Repository for payments table.
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,

    // ConfigService reads local simulation mode from .env.
    private readonly configService: ConfigService,

    // Shared RabbitMQ publisher for payment result events.
    private readonly rabbitMqPublisher: RabbitMqPublisher,
  ) {}

  // Handles inventory.reserved by creating and processing a simulated payment.
  async processPaymentForReservedInventory(event: InventoryReservedEvent) {
    // For now, amount is calculated locally from reserved item quantities only.
    // In a production system, payment amount should come from a trusted order total.
    const amountCents = this.calculateTemporaryAmount(event);

    // Create a pending payment record before processing.
    const payment = this.paymentsRepository.create({
      orderId: event.orderId,
      userId: event.userId,
      amountCents,
      status: PaymentStatus.Pending,
      failureReason: null,
    });

    const savedPayment = await this.paymentsRepository.save(payment);

    // Simulate external payment gateway result.
    const approved = this.shouldApprovePayment();

    if (!approved) {
      savedPayment.status = PaymentStatus.Failed;
      savedPayment.failureReason = 'Simulated payment failure';
      const failedPayment = await this.paymentsRepository.save(savedPayment);
      const paymentFailedEvent: PaymentFailedEvent = {
        orderId: event.orderId,
        userId: event.userId,
        paymentId: failedPayment.id,
        amountCents: failedPayment.amountCents,
        reason: failedPayment.failureReason ?? 'Unknown payment failure',
        failedAt: new Date().toISOString(),
      };

      await this.rabbitMqPublisher.publish(
        EventNames.PaymentFailed,
        paymentFailedEvent,
      );

      return failedPayment;
    }

    savedPayment.status = PaymentStatus.Succeeded;
    savedPayment.failureReason = null;

    const succeededPayment = await this.paymentsRepository.save(savedPayment);

    const paymentSucceededEvent: PaymentSucceededEvent = {
      orderId: event.orderId,
      userId: event.userId,
      paymentId: succeededPayment.id,
      amountCents: succeededPayment.amountCents,
      paidAt: new Date().toISOString(),
    };

    await this.rabbitMqPublisher.publish(
      EventNames.PaymentSucceeded,
      paymentSucceededEvent,
    );

    return succeededPayment;
  }

  // Lists payment records for local debugging.
  async findAll() {
    return this.paymentsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Temporary amount calculation for local learning.
  // This avoids introducing another Order Service HTTP call in this milestone.
  private calculateTemporaryAmount(event: InventoryReservedEvent) {
    // The InventoryReservedEvent only has productId and quantity.
    // To keep the milestone simple, we use a placeholder amount of 100 cents per unit.
    // We will improve this later by including order total or calling Order Service.
    return event.items.reduce((sum, item) => sum + item.quantity * 100, 0);
  }

  // Decides whether the simulated payment should pass or fail.
  private shouldApprovePayment() {
    const mode = this.configService.get<string>('PAYMENT_SIMULATION_MODE');

    if (mode === 'always_success') {
      return true;
    }
    if (mode === 'always_fail') {
      return false;
    }
    // In random mode, about 80% of payments succeed.
    return Math.random() < 0.8;
  }
}
