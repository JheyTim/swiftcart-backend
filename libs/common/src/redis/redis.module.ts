import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redis = new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: Number(config.get<number>('REDIS_PORT', 6379)),
        });

        redis.on('error', (error) => {
          console.error('Redis connection error:', error);
        });

        return redis;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
