import { ApiProperty } from '@nestjs/swagger';
import { CustomerDocumentType } from '../../database/entities/customer.entity';
import {
  ProductCurrency,
  ProductNetwork,
  ProductStatus,
  ProductType,
} from '../../database/entities/product.entity';

export class CustomerProductItemResponseDto {
  @ApiProperty({ enum: ProductNetwork, example: ProductNetwork.VISA })
  network: ProductNetwork;

  @ApiProperty({ enum: ProductCurrency, example: ProductCurrency.PEN })
  currency: ProductCurrency;

  @ApiProperty({ enum: ProductType, example: ProductType.CARD })
  type: ProductType;

  @ApiProperty({ enum: ProductStatus, example: ProductStatus.REQUESTED })
  status: ProductStatus;

  @ApiProperty({
    nullable: true,
    example: {
      card_number: '4111111111111111',
      card_expiration_date: '12/30',
      card_cvc: '123',
    },
  })
  metadata: Record<string, unknown> | null;
}

export class CustomerProductsResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    enum: CustomerDocumentType,
    example: CustomerDocumentType.DNI,
  })
  documentType: CustomerDocumentType;

  @ApiProperty({ example: '12345678' })
  documentNumber: string;

  @ApiProperty({ example: 'Jane Doe' })
  fullName: string;

  @ApiProperty({ example: 30 })
  age: number;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @ApiProperty({ type: CustomerProductItemResponseDto })
  product: CustomerProductItemResponseDto;
}
