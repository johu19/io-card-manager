import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CustomerDocumentType } from '../../database/entities/customer.entity';
import {
  ProductCurrency,
  ProductNetwork,
} from '../../database/entities/product.entity';

export class CustomerDto {
  @ApiProperty({ enum: CustomerDocumentType, example: CustomerDocumentType.DNI })
  @IsDefined()
  @IsEnum(CustomerDocumentType)
  documentType: CustomerDocumentType;

  @ApiProperty({ example: '12345678' })
  @IsDefined()
  @IsString()
  documentNumber: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsDefined()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsDefined()
  @IsString()
  fullName: string;

  @ApiProperty({ example: 30, minimum: 0 })
  @IsDefined()
  @IsInt()
  @Min(0)
  age: number;
}

export class ProductDto {
  @ApiProperty({ enum: ProductNetwork, example: ProductNetwork.VISA })
  @IsDefined()
  @IsEnum(ProductNetwork)
  network: ProductNetwork;

  @ApiProperty({ enum: ProductCurrency, example: ProductCurrency.PEN })
  @IsDefined()
  @IsEnum(ProductCurrency)
  currency: ProductCurrency;
}

export class IssueCardDto {
  @ApiProperty({ type: CustomerDto })
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ApiProperty({ type: ProductDto })
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => ProductDto)
  product: ProductDto;

  @ApiProperty({ example: false })
  @IsDefined()
  @IsBoolean()
  forceError: boolean;
}
