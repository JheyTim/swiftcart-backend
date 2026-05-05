import { CORRELATION_ID_HEADER } from '@app/common';
import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AddStockDto } from './dto/add-stock.dto';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';

// This service forwards inventory requests from API Gateway to Inventory Service.
@Injectable()
export class InventoryProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}
  create(createDto: CreateInventoryItemDto, correlationId: string) {
    return this.forwardRequest(
      'post',
      '/inventory/items',
      correlationId,
      createDto,
    );
  }

  findAll(correlationId: string) {
    return this.forwardRequest('get', '/inventory/items', correlationId);
  }

  findByProductId(productId: string, correlationId: string) {
    return this.forwardRequest(
      'get',
      `/inventory/items/${productId}`,
      correlationId,
    );
  }

  addStock(productId: string, addStockDto: AddStockDto, correlationId: string) {
    return this.forwardRequest(
      'patch',
      `/inventory/items/${productId}/add-stock`,
      correlationId,
      addStockDto,
    );
  }

  private async forwardRequest(
    method: 'get' | 'post' | 'patch',
    path: string,
    correlationId: string,
    body?: unknown,
  ) {
    const inventoryServiceUrl = this.configService.get<string>(
      'INVENTORY_SERVICE_URL',
    );
    try {
      // HttpService returns an RxJS Observable, so firstValueFrom converts it to a Promise.
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${inventoryServiceUrl}${path}`,
          data: body,
          headers: {
            [CORRELATION_ID_HEADER]: correlationId,
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
      throw new HttpException('Inventory Service is unavailable', 503);
    }
  }
}
