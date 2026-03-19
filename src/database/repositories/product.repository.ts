import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repository: Repository<ProductEntity>,
  ) {}

  create(data: DeepPartial<ProductEntity>): Promise<ProductEntity> {
    const product = this.repository.create(data);
    return this.repository.save(product);
  }

  findById(id: number): Promise<ProductEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        customer: true,
      },
    });
  }

  async update(
    id: number,
    data: QueryDeepPartialEntity<ProductEntity>,
  ): Promise<ProductEntity | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }
}
