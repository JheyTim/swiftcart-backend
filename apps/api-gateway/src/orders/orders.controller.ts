import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from '@app/common';
import { OrdersProxyService } from './orders-proxy.service';

// TypeScript helper type for requests that passed JWT authentication.
type AuthenticatedRequest = Request & {
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
    @Req() request: AuthenticatedRequest,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersProxyService.create(request.user.userId, createOrderDto);
  }

  // Lists orders owned by the authenticated user.
  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.ordersProxyService.findAll(request.user.userId);
  }

  // Gets one order owned by the authenticated user.
  @Get(':id')
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.ordersProxyService.findOne(request.user.userId, id);
  }
}
