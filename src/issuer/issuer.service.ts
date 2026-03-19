import { randomUUID } from 'crypto';
import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CARD_ISSUANCE_TOPIC } from '../kafka/kafka.constants';
import { KafkaService } from '../kafka/kafka.service';
import { IssueCardDto } from './dto/issue-card.dto';
import {
  CardRequestStatus,
  IssueCardResponse,
} from './interfaces/issue-card-response.interface';
import { CustomerProductsResponseDto } from './dto/customer-products-response.dto';
import { CustomerRepository } from '../database/repositories/customer.repository';
import { ProductRepository } from '../database/repositories/product.repository';
import {
  ProductEntity,
  ProductStatus,
  ProductType,
} from '../database/entities/product.entity';
import { CardEvent } from '../kafka/interfaces/card-event.interface';
import { CustomerEntity } from '../database/entities/customer.entity';

@Injectable()
export class IssuerService {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly customerRepository: CustomerRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async issueCard(payload: IssueCardDto): Promise<IssueCardResponse> {
    const customerToUpsert = new CustomerEntity();
    customerToUpsert.fullName = payload.customer.fullName;
    customerToUpsert.documentNumber = payload.customer.documentNumber;
    customerToUpsert.age = payload.customer.age;
    customerToUpsert.email = payload.customer.email;
    customerToUpsert.documentType = payload.customer.documentType;

    const customer =
      await this.customerRepository.upsertByDocumentNumber(customerToUpsert);

    const productToCreate = new ProductEntity();
    productToCreate.network = payload.product.network;
    productToCreate.currency = payload.product.currency;
    productToCreate.customer = customer;
    productToCreate.type = ProductType.CARD;
    productToCreate.customer = customer;
    productToCreate.status = ProductStatus.REQUESTED;

    const createdProduct = await this.productRepository.create(productToCreate);

    const event: CardEvent = {
      id: createdProduct.id,
      source: randomUUID(),
      data: { productId: createdProduct.id, forceError: payload.forceError },
      type: 'card.requested',
    };

    try {
      await this.kafkaService.sendMessage({
        topic: CARD_ISSUANCE_TOPIC,
        value: JSON.stringify(event),
      });

      return {
        requestId: event.id,
        status: CardRequestStatus.REQUESTED,
      };
    } catch {
      throw new ServiceUnavailableException(
        'Card issuance request could not be published',
      );
    }
  }

  async getCustomerProductsByDocumentNumber(
    documentNumber: string,
  ): Promise<CustomerProductsResponseDto> {
    const customer =
      await this.customerRepository.findByDocumentNumber(documentNumber);

    if (!customer) {
      throw new NotFoundException(
        `Customer not found with document number ${documentNumber}`,
      );
    }

    return {
      id: customer.id,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
      fullName: customer.fullName,
      age: customer.age,
      email: customer.email,
      products: customer.products.map((product) => ({
        network: product.network,
        currency: product.currency,
        type: product.type,
        status: product.status,
        metadata: product.metadata as Record<string, unknown> | null,
      })),
    };
  }
}
