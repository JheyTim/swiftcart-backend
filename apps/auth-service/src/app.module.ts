import {
  CorrelationIdMiddleware,
  RequestLoggingMiddleware,
  envValidationSchema,
  createPostgresTypeOrmModule,
} from '@app/common';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';
import { HealthModule } from './health/health.module';

/// AppModule is the root module for the Auth Service.
@Module({
  imports: [
    // Loads .env variables and makes ConfigService available everywhere.
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    // Connects the Auth Service to PostgreSQL through TypeORM.
    createPostgresTypeOrmModule([User]),
    
    // Authentication feature module.
    AuthModule,

    HealthModule,
  ],
})
export class AppModule implements NestModule {
  // Middleware runs before controllers.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
