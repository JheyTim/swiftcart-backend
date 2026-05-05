import { createPostgresTypeOrmAsyncOptions } from '@app/common/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(createPostgresTypeOrmAsyncOptions([User])),
    AuthModule,
  ],
})
export class AppModule {}
