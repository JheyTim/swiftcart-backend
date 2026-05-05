import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service';
// This controller exposes local debugging routes for Payment Service.
// In production, payment records should be protected and scoped carefully.
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Lists payment records so we can debug local event flow.
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }
}
