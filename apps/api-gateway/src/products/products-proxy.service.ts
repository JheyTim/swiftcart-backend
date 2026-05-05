import { CORRELATION_ID_HEADER } from '@app/common';
import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// This service forwards product requests from the API Gateway to Product Service.
@Injectable()
export class ProductsProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}
  // Forward product creation.
  create(createProductDto: CreateProductDto, correlationId: string) {
    return this.forwardRequest(
      'post',
      '/products',
      correlationId,
      createProductDto,
    );
  }

  // Forward product list request.
  findAll(correlationId: string) {
    return this.forwardRequest('get', '/products', correlationId);
  }

  // Forward product detail request.
  findOne(id: string, correlationId: string) {
    return this.forwardRequest('get', `/products/${id}`, correlationId);
  }

  // Forward product update request.
  update(
    id: string,
    updateProductDto: UpdateProductDto,
    correlationId: string,
  ) {
    return this.forwardRequest(
      'patch',
      `/products/${id}`,
      correlationId,
      updateProductDto,
    );
  }

  // Shared helper for forwarding requests to Product Service.
  private async forwardRequest(
    method: 'get' | 'post' | 'patch',
    path: string,
    correlationId: string,
    body?: unknown,
  ) {
    const productServiceUrl = this.configService.get<string>(
      'PRODUCT_SERVICE_URL',
    );

    try {
      // Use the matching Axios method based on the operation type.
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${productServiceUrl}${path}`,
          data: body,
          headers: {
            [CORRELATION_ID_HEADER]: correlationId,
          },
        }),
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      // Preserve HTTP errors returned by Product Service.

      if (axiosError.response) {
        throw new HttpException(
          axiosError.response.data,
          axiosError.response.status,
        );
      }

      // No response usually means Product Service is down or unreachable.
      throw new HttpException('Product Service is unavailable', 503);
    }
  }
}
