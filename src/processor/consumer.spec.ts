import { CARD_ISSUANCE_DLQ_TOPIC } from '../kafka/kafka.constants';
import { Consumer } from './consumer';

describe('Consumer', () => {
  const originalRetries = process.env.KAFKA_PROCESSOR_MAX_RETRIES;

  afterEach(() => {
    if (originalRetries === undefined) {
      delete process.env.KAFKA_PROCESSOR_MAX_RETRIES;
    } else {
      process.env.KAFKA_PROCESSOR_MAX_RETRIES = originalRetries;
    }
    jest.clearAllMocks();
  });

  it('retries until the processor succeeds', async () => {
    process.env.KAFKA_PROCESSOR_MAX_RETRIES = '3';

    const kafkaService = {
      sendMessage: jest.fn(),
    };
    const processorService = {
      handleCardIssuedEvent: jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue(undefined),
    };

    const consumer = new Consumer(
      kafkaService as never,
      processorService as never,
    );

    await (consumer as any).processWithRetry({
      id: 42,
      source: 'source-1',
      data: { productId: 42 },
      type: 'card.requested',
    });

    expect(processorService.handleCardIssuedEvent).toHaveBeenCalledTimes(3);
    expect(kafkaService.sendMessage).not.toHaveBeenCalled();
  });

  it('publishes to the dlq after max retries are exhausted', async () => {
    process.env.KAFKA_PROCESSOR_MAX_RETRIES = '3';

    const kafkaService = {
      sendMessage: jest.fn().mockResolvedValue(true),
    };
    const processorService = {
      handleCardIssuedEvent: jest
        .fn()
        .mockRejectedValue(new Error('persistent failure')),
    };

    const consumer = new Consumer(
      kafkaService as never,
      processorService as never,
    );

    await (consumer as any).processWithRetry({
      id: 42,
      source: 'source-1',
      data: { productId: 42 },
      type: 'card.requested',
    });

    expect(processorService.handleCardIssuedEvent).toHaveBeenCalledTimes(3);
    expect(kafkaService.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: CARD_ISSUANCE_DLQ_TOPIC,
      }),
    );

    const dlqPayload = JSON.parse(
      kafkaService.sendMessage.mock.calls[0][0].value as string,
    );
    expect(dlqPayload.type).toBe('card.issuance_failed');
    expect(dlqPayload.data.error).toEqual({
      attempts: 3,
      message: 'persistent failure',
    });
  });
});
