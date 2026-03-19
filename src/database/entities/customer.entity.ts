import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductEntity } from './product.entity';

export enum CustomerDocumentType {
  DNI = 'DNI',
}

@Entity({ name: 'customer' })
export class CustomerEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({
    name: 'document_type',
    type: 'enum',
    enum: CustomerDocumentType,
    enumName: 'customer_document_type_enum',
  })
  documentType: CustomerDocumentType;

  @Column({ name: 'document_number', type: 'varchar', unique: true })
  documentNumber: string;

  @Column({ name: 'full_name', type: 'varchar' })
  fullName: string;

  @Column({ type: 'integer' })
  age: number;

  @Column({ type: 'varchar' })
  email: string;

  @OneToMany(() => ProductEntity, (product) => product.customer)
  products: ProductEntity[];
}
