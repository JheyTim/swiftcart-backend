import {
  EventNames,
  ProductCreatedEvent,
  RabbitMqPublisher,
} from '@app/common';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { REDIS_CLIENT } from '@app/common/redis/redis.constants';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';

// ProductsService contains business logic for product operations.
@Injectable()
export class ProductsService {
  // Cache key for the full product list.
  private readonly productListCacheKey = 'products:list';

  constructor(
    // TypeORM repository gives us database access for Product rows.
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,

    // Inject the shared Redis client from RedisModule.
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,

    // ConfigService reads values from .env.
    private readonly configService: ConfigService,

    // Publisher used to emit domain events after successful product writes.
    private readonly rabbitMqPublisher: RabbitMqPublisher,
  ) {}

  // Creates a product and clears product caches.
  async create(createProductDto: CreateProductDto) {
    // Create a Product entity instance from validated input.
    const product = this.productsRepository.create(createProductDto);

    // Save the product to PostgreSQL first.
    // We publish the event only after the database write succeeds.
    const savedProduct = await this.productsRepository.save(product);

    // Product list is now stale, so remove cached list data.
    await this.invalidateProductCaches(savedProduct.id);

    // Build the event payload using only the fields other services need.
    const eventPayload: ProductCreatedEvent = {
      productId: savedProduct.id,
      name: savedProduct.name,
      priceCents: savedProduct.priceCents,
      createdAt: savedProduct.createdAt.toISOString(),
    };

    // Publish product.created so other services can react asynchronously.
    await this.rabbitMqPublisher.publish(
      EventNames.ProductCreated,
      eventPayload,
    );

    return savedProduct;
  }

  // Returns all products, using Redis cache when available.
  async findAll() {
    // Try reading the product list from Redis first.
    const cachedProducts = await this.redis.get(this.productListCacheKey);

    if (cachedProducts) {
      // Redis stores strings, so JSON.parse converts it back to objects.
      return JSON.parse(cachedProducts);
    }

    // If cache misses, read from PostgreSQL.
    const products = await this.productsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    // Cache the result so future reads can avoid the database briefly.
    await this.redis.set(
      this.productListCacheKey,
      JSON.stringify(products),
      'EX',
      this.getCacheTtlSeconds(),
    );

    return products;
  }

  // Returns one product by ID, using Redis cache when available.
  async findOne(id: string) {
    const cacheKey = this.getProductDetailCacheKey(id);
    // Try reading this product from Redis first.
    const cachedProduct = await this.redis.get(cacheKey);

    if (cachedProduct) {
      return JSON.parse(cachedProduct);
    }

    // If cache misses, read from PostgreSQL.
    const product = await this.productsRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Cache product detail for faster repeated reads.
    await this.redis.set(
      cacheKey,
      JSON.stringify(product),
      'EX',
      this.getCacheTtlSeconds(),
    );

    return product;
  }

  // Updates one product and clears affected caches.
  async update(id: string, updateProductDto: UpdateProductDto) {
    // Preload creates an entity with the given ID and updated fields.
    // If the row does not exist, preload returns undefined.
    const product = await this.productsRepository.preload({
      id,
      ...updateProductDto,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Save the updated product to PostgreSQL.
    const savedProduct = await this.productsRepository.save(product);

    // Both the list and detail cache may now be stale.
    await this.invalidateProductCaches(id);

    return savedProduct;
  }

  // Builds the Redis key for one product detail cache entry.
  private getProductDetailCacheKey(id: string) {
    return `products:detail:${id}`;
  }

  // Reads cache TTL from config and falls back to 60 seconds.
  private getCacheTtlSeconds() {
    return Number(this.configService.get<number>('PRODUCT_CACHE_TTL_SECONDS'));
  }

  // Removes stale Redis entries after product writes.
  private async invalidateProductCaches(productId: string) {
    await this.redis.del(this.productListCacheKey);
    await this.redis.del(this.getProductDetailCacheKey(productId));
  }
}
