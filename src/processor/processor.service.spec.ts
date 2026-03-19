/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ProductStatus } from '../database/entities/product.entity';
import { CARDS_ISSUED_TOPIC } from '../kafka/kafka.constants';
import { ProcessorService } from './processor.service';

describe('ProcessorService', () => {
  const kafkaService = {
    sendMessage: jest.fn(),
  };
  const productRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  let service: ProcessorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProcessorService(
      kafkaService as never,
      productRepository as never,
    );
  });

  it('updates the product and publishes an issued event', async () => {
    const product = {
      id: 42,
      status: ProductStatus.REQUESTED,
      metadata: null,
    };

    productRepository.findById.mockResolvedValue(product);
    productRepository.update.mockResolvedValue({
      ...product,
      status: ProductStatus.ISSUED,
    });
    kafkaService.sendMessage.mockResolvedValue(true);
    jest.spyOn(service, 'issueCard').mockResolvedValue({
      card_number: '4111111111111111',
      card_expiration_date: '12/30',
      card_cvc: '123',
    });

    await service.handleCardIssuedEvent(
      {
        id: 42,
        source: 'source-1',
        data: { productId: 42, forceError: false },
        type: 'card.requested',
      },
      2,
    );

    expect(productRepository.update).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        status: ProductStatus.ISSUED,
        metadata: expect.objectContaining({
          card_number: '4111111111111111',
          amount_of_tries: 2,
        }),
      }),
    );
    expect(kafkaService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: CARDS_ISSUED_TOPIC,
      }),
    );
  });

  it('throws when the event is marked as forceError', async () => {
    await expect(
      service.handleCardIssuedEvent(
        {
          id: 42,
          source: 'source-1',
          data: { productId: 42, forceError: true },
          type: 'card.requested',
        },
        1,
      ),
    ).rejects.toThrow('Unable to issue card');
  });
});
