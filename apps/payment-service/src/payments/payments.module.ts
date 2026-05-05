import { RabbitMqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

// PaymentsModule groups payment routes, repositories, and business logic.
@Module({
  imports: [
    // Makes Payment repository injectable.
    TypeOrmModule.forFeature([Payment]),

    RabbitMqModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
