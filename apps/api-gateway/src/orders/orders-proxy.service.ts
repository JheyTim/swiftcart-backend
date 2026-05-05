import { CORRELATION_ID_HEADER } from '@app/common';
import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { CreateOrderDto } from './dto/create-order.dto';
// This service forwards order requests from API Gateway to Order Service.
@Injectable()
export class OrdersProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // Forward order creation and include the authenticated user ID as an internal header.
  create(
    userId: string,
    correlationId: string,
    createOrderDto: CreateOrderDto,
  ) {
    return this.forwardRequest(
      'post',
      '/orders',
      userId,
      correlationId,
      createOrderDto,
    );
  }

  // Forward list orders request.
  findAll(userId: string, correlationId: string) {
    return this.forwardRequest('get', '/orders', userId, correlationId);
  }

  // Forward get one order request.
  findOne(userId: string, correlationId: string, orderId: string) {
    return this.forwardRequest(
      'get',
      `/orders/${orderId}`,
      userId,
      correlationId,
    );
  }

  // Shared helper for forwarding requests to Order Service.
  private async forwardRequest(
    method: 'get' | 'post',
    path: string,
    userId: string,
    correlationId: string,
    body?: unknown,
  ) {
    const orderServiceUrl = this.configService.get<string>('ORDER_SERVICE_URL');

    try {
      // HttpService returns an RxJS Observable, so firstValueFrom converts it to a Promise.
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${orderServiceUrl}${path}`,
          data: body,
          headers: {
            [CORRELATION_ID_HEADER]: correlationId,
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
