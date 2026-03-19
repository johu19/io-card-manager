import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';

@Injectable()
export class CustomerRepository {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly repository: Repository<CustomerEntity>,
  ) {}

  async upsertByDocumentNumber(
    entity: CustomerEntity,
  ): Promise<CustomerEntity> {
    await this.repository.upsert(entity, {
      conflictPaths: ['documentNumber'],
    });

    const customer = await this.repository.findOneOrFail({
      where: {
        documentNumber: entity.documentNumber,
      },
      relations: {
        product: true,
      },
    });

    return customer;
  }

  findByEmailOrDocumentNumber(
    email: string,
    documentNumber: string,
  ): Promise<CustomerEntity | null> {
    return this.repository.findOne({
      where: [{ email }, { documentNumber }],
      relations: {
        product: true,
      },
    });
  }

  findByDocumentNumber(documentNumber: string): Promise<CustomerEntity | null> {
    return this.repository.findOne({
      where: { documentNumber },
      relations: {
        product: true,
      },
    });
  }
}
