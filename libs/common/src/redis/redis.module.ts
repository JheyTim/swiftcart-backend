import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

// RedisModule provides one shared Redis client for the Product Service.
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Create a Redis client using host and port from .env.
        const redis = new Redis({
          host: configService.get<string>('REDIS_HOST'),
          password: configService.get<string>('REDIS_PASSWORD'),
          port: Number(configService.get<number>('REDIS_PORT')),
        });

        // Log connection errors so local debugging is easier.
        redis.on('error', (error) => {
          console.error('Redis connection error:', error);
        });

        return redis;
      },
    },
  ],
  // Export the Redis client so other modules can inject it.
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
