import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from './entities/customer.entity';
import { ProductEntity } from './entities/product.entity';
import { CustomerRepository } from './repositories/customer.repository';
import { ProductRepository } from './repositories/product.repository';
import { getTypeOrmOptions, isDatabaseEnabled } from './typeorm.config';

@Module({})
export class DatabaseModule {
  static register(): DynamicModule {
    if (!isDatabaseEnabled()) {
      return {
        module: DatabaseModule,
      };
    }

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRoot(getTypeOrmOptions()),
        TypeOrmModule.forFeature([CustomerEntity, ProductEntity]),
      ],
      providers: [CustomerRepository, ProductRepository],
      exports: [CustomerRepository, ProductRepository],
    };
  }
}
