import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { CreateOrderDto } from '@app/common';
// This service forwards order requests from API Gateway to Order Service.
@Injectable()
export class OrdersProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // Forward order creation and include the authenticated user ID as an internal header.
  create(userId: string, createOrderDto: CreateOrderDto) {
    return this.forwardRequest('post', '/orders', userId, createOrderDto);
  }

  // Forward list orders request.
  findAll(userId: string) {
    return this.forwardRequest('get', '/orders', userId);
  }

  // Forward get one order request.
  findOne(userId: string, orderId: string) {
    return this.forwardRequest('get', `/orders/${orderId}`, userId);
  }

  // Shared helper for forwarding requests to Order Service.
  private async forwardRequest(
    method: 'get' | 'post',
    path: string,
    userId: string,
    body?: unknown,
  ) {
    const orderServiceUrl = this.configService.get<string>('ORDER_SERVICE_URL');
    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${orderServiceUrl}${path}`,
          data: body,
          headers: {
            // Internal header used by Order Service to know who owns the order.
            // In production, internal services should only accept this from trusted gateway traffic.
            'x-user-id': userId,
          },
        }),
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      if (axiosError.response) {
        throw new HttpException(
          axiosError.response.data,
          axiosError.response.status,
        );
      }
      throw new HttpException('Order Service is unavailable', 503);
    }
  }
}
