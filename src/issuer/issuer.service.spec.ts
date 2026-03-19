/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CustomerDocumentType } from '../database/entities/customer.entity';
import {
  ProductCurrency,
  ProductNetwork,
  ProductStatus,
  ProductType,
} from '../database/entities/product.entity';
import { CARD_ISSUANCE_TOPIC } from '../kafka/kafka.constants';
import { IssuerService } from './issuer.service';
import { CardRequestStatus } from './interfaces/issue-card-response.interface';

describe('IssuerService', () => {
  const kafkaService = {
    sendMessage: jest.fn(),
  };
  const customerRepository = {
    upsertByDocumentNumber: jest.fn(),
    findByDocumentNumber: jest.fn(),
  };
  const productRepository = {
    create: jest.fn(),
  };

  let service: IssuerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IssuerService(
      kafkaService as never,
      customerRepository as never,
      productRepository as never,
    );
  });

  it('issues a card and publishes a requested event', async () => {
    const payload = {
      customer: {
        documentType: CustomerDocumentType.DNI,
        documentNumber: '12345678',
        email: 'jane@example.com',
        fullName: 'Jane Doe',
        age: 30,
      },
      product: {
        network: ProductNetwork.VISA,
        currency: ProductCurrency.PEN,
      },
      forceError: false,
    };

    customerRepository.upsertByDocumentNumber.mockResolvedValue({ id: 7 });
    productRepository.create.mockResolvedValue({ id: 42 });
    kafkaService.sendMessage.mockResolvedValue(true);

    const result = await service.issueCard(payload);

    expect(result).toEqual({
      requestId: 42,
      status: CardRequestStatus.REQUESTED,
    });
    expect(kafkaService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: CARD_ISSUANCE_TOPIC,
      }),
    );

    const publishedEvent = JSON.parse(
      kafkaService.sendMessage.mock.calls[0][0].value as string,
    );
    expect(publishedEvent).toMatchObject({
      id: 42,
      data: { productId: 42, forceError: false },
      type: 'card.requested',
    });
  });

  it('throws service unavailable when publishing fails', async () => {
    const payload = {
      customer: {
        documentType: CustomerDocumentType.DNI,
        documentNumber: '12345678',
        email: 'jane@example.com',
        fullName: 'Jane Doe',
        age: 30,
      },
      product: {
        network: ProductNetwork.VISA,
        currency: ProductCurrency.PEN,
      },
      forceError: false,
    };

    customerRepository.upsertByDocumentNumber.mockResolvedValue({ id: 7 });
    productRepository.create.mockResolvedValue({ id: 42 });
    kafkaService.sendMessage.mockRejectedValue(new Error('kafka down'));

    await expect(service.issueCard(payload)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('returns customer products by document number', async () => {
    customerRepository.findByDocumentNumber.mockResolvedValue({
      id: 1,
      documentType: CustomerDocumentType.DNI,
      documentNumber: '12345678',
      fullName: 'Jane Doe',
      age: 30,
      email: 'jane@example.com',
      products: [
        {
          network: ProductNetwork.VISA,
          currency: ProductCurrency.USD,
          type: ProductType.CARD,
          status: ProductStatus.ISSUED,
          metadata: { card_number: '4111111111111111' },
        },
      ],
    });

    await expect(
      service.getCustomerProductsByDocumentNumber('12345678'),
    ).resolves.toEqual({
      id: 1,
      documentType: CustomerDocumentType.DNI,
      documentNumber: '12345678',
      fullName: 'Jane Doe',
      age: 30,
      email: 'jane@example.com',
      products: [
        {
          network: ProductNetwork.VISA,
          currency: ProductCurrency.USD,
          type: ProductType.CARD,
          status: ProductStatus.ISSUED,
          metadata: { card_number: '4111111111111111' },
        },
      ],
    });
  });

  it('throws when customer is not found by document number', async () => {
    customerRepository.findByDocumentNumber.mockResolvedValue(null);

    await expect(
      service.getCustomerProductsByDocumentNumber('12345678'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
