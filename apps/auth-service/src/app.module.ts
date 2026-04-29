import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';

// AppModule is the root module for the Auth Service.
@Module({
  imports: [
    // Loads .env variables and makes ConfigService available everywhere.
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Connects the Auth Service to PostgreSQL through TypeORM.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: Number(configService.get<number>('POSTGRES_PORT')),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        // Register entities used by this service.
        entities: [User],
        // synchronize auto-creates tables from entities.
        // This is convenient for local learning only.
        // In production, use migrations instead.
        synchronize: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    // Authentication feature module.
    AuthModule,
  ],
})
export class AppModule {}
