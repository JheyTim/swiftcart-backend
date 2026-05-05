import type { RequestWithCorrelationId } from '@app/common';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersProxyService } from './orders-proxy.service';

// TypeScript helper type for requests that passed JWT authentication.
type AuthenticatedRequestWithCorrelationId = RequestWithCorrelationId & {
  user: {
    userId: string;
    email: string;
  };
};

// This controller exposes order endpoints from the API Gateway.
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersProxyService: OrdersProxyService) {}
  // Creates an order for the authenticated user.
  @Post()
  create(
    @Req() request: AuthenticatedRequestWithCorrelationId,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersProxyService.create(
      request.user.userId,
      request.correlationId,
      createOrderDto,
    );
  }

  // Lists orders owned by the authenticated user.
  @Get()
  findAll(@Req() request: AuthenticatedRequestWithCorrelationId) {
    return this.ordersProxyService.findAll(
      request.user.userId,
      request.correlationId,
    );
  }

  // Gets one order owned by the authenticated user.
  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequestWithCorrelationId,
    @Param('id') id: string,
  ) {
    return this.ordersProxyService.findOne(
      request.user.userId,
      request.correlationId,
      id,
    );
  }
}
