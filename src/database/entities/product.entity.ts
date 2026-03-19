import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CustomerEntity } from './customer.entity';

export enum ProductNetwork {
  VISA = 'VISA',
}

export enum ProductCurrency {
  PEN = 'PEN',
  USD = 'USD',
}

export enum ProductType {
  CARD = 'CARD',
}

export enum ProductStatus {
  ISSUED = 'ISSUED',
  REQUESTED = 'REQUESTED',
}

@Entity({ name: 'product' })
export class ProductEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({
    type: 'enum',
    enum: ProductNetwork,
    enumName: 'product_network_enum',
  })
  network: ProductNetwork;

  @Column({
    type: 'enum',
    enum: ProductCurrency,
    enumName: 'product_currency_enum',
  })
  currency: ProductCurrency;

  @Column({
    type: 'enum',
    enum: ProductType,
    enumName: 'product_type_enum',
  })
  type: ProductType;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    enumName: 'product_status_enum',
  })
  status: ProductStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ name: 'customer_id', type: 'integer' })
  customerId: number;

  @OneToOne(() => CustomerEntity, (customer) => customer.product, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerEntity;
}
