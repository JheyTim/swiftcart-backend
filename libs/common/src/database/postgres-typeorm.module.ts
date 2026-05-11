import type { DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

type TypeOrmEntities = NonNullable<TypeOrmModuleOptions['entities']>;

export function createPostgresTypeOrmModule(
  entities: TypeOrmEntities,
): DynamicModule {
  return TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      createPostgresTypeOrmOptions(configService, entities),
  });
}

export function createPostgresTypeOrmOptions(
  configService: ConfigService,
  entities: TypeOrmEntities,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.get<string>('POSTGRES_HOST'),
    port: Number(configService.get<number>('POSTGRES_PORT')),
    username: configService.get<string>('POSTGRES_USER'),
    password: configService.get<string>('POSTGRES_PASSWORD'),
    database: configService.get<string>('POSTGRES_DB'),
    entities,
    // Local learning convenience only.
    // In production, use TypeORM migrations instead.
    // synchronize: configService.get<string>('NODE_ENV') === 'development',
    synchronize: true
  };
}
