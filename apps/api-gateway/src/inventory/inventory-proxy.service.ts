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
  create(createDto: CreateInventoryItemDto) {
    return this.forwardRequest('post', '/inventory/items', createDto);
  }

  findAll() {
    return this.forwardRequest('get', '/inventory/items');
  }

  findByProductId(productId: string) {
    return this.forwardRequest('get', `/inventory/items/${productId}`);
  }

  addStock(productId: string, addStockDto: AddStockDto) {
    return this.forwardRequest(
      'patch',
      `/inventory/items/${productId}/add-stock`,
      addStockDto,
    );
  }

  private async forwardRequest(
    method: 'get' | 'post' | 'patch',
    path: string,
    body?: unknown,
  ) {
    const inventoryServiceUrl = this.configService.get<string>(
      'INVENTORY_SERVICE_URL',
    );
    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${inventoryServiceUrl}${path}`,
          data: body,
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
