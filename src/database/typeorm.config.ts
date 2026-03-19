import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { getRequiredEnv, getRequiredNumberEnv } from '../config/env';
import { CustomerEntity } from './entities/customer.entity';
import { ProductEntity } from './entities/product.entity';

export function isDatabaseEnabled(): boolean {
  return process.env.DB_ENABLED !== 'false' && process.env.NODE_ENV !== 'test';
}

export function getTypeOrmOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: getRequiredEnv('DB_HOST'),
    port: getRequiredNumberEnv('DB_PORT'),
    username: getRequiredEnv('DB_USER'),
    password: getRequiredEnv('DB_PASSWORD'),
    database: getRequiredEnv('DB_NAME'),
    entities: [CustomerEntity, ProductEntity],
    migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
    synchronize: false,
  };
}
