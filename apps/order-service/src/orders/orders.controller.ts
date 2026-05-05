import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { CreateOrderDto } from '@app/common';
import { OrdersService } from './orders.service';

// This controller exposes Order Service HTTP routes.
// API Gateway calls these routes after validating the user's JWT.
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  // Creates an order for the user ID forwarded by the API Gateway.
  @Post()
  create(
    @Headers('x-user-id') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(userId, createOrderDto);
  }

  // Lists orders owned by the authenticated user.
  @Get()
  findAll(@Headers('x-user-id') userId: string) {
    return this.ordersService.findAllForUser(userId);
  }

  // Gets one order owned by the authenticated user.
  @Get(':id')
  findOne(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.ordersService.findOneForUser(userId, id);
  }
}
