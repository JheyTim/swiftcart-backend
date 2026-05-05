import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

export function createPostgresTypeOrmOptions(
  configService: ConfigService,
  entities: EntityClassOrSchema[]
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.get<string>('POSTGRES_HOST'),
    port: Number(configService.get<number>('POSTGRES_PORT')),
    username: configService.get<string>('POSTGRES_USER'),
    password: configService.get<string>('POSTGRES_PASSWORD'),
    database: configService.get<string>('POSTGRES_DB'),
    entities,
    synchronize: configService.get<string>('NODE_ENV') === 'development',
  };
}

export function createPostgresTypeOrmAsyncOptions(
  entities: EntityClassOrSchema[]
): TypeOrmModuleAsyncOptions {
  return {
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      createPostgresTypeOrmOptions(configService, entities),
  };
}
