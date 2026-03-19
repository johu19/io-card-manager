/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CARD_ISSUANCE_DLQ_TOPIC } from '../kafka/kafka.constants';
import { Consumer } from './consumer';

describe('Consumer', () => {
  const originalRetries = process.env.KAFKA_PROCESSOR_MAX_RETRIES;

  afterEach(() => {
    jest.useRealTimers();
    if (originalRetries === undefined) {
      delete process.env.KAFKA_PROCESSOR_MAX_RETRIES;
    } else {
      process.env.KAFKA_PROCESSOR_MAX_RETRIES = originalRetries;
    }
    jest.clearAllMocks();
  });

  it('retries until the processor succeeds', async () => {
    process.env.KAFKA_PROCESSOR_MAX_RETRIES = '4';
    jest.useFakeTimers();

    const kafkaService = {
      sendMessage: jest.fn(),
    };
    const processorService = {
      handleCardIssuedEvent: jest
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockRejectedValueOnce(new Error('fail 3'))
        .mockResolvedValue(undefined),
    };

    const consumer = new Consumer(
      kafkaService as never,
      processorService as never,
    );

    const processingPromise = (consumer as any).processWithRetry({
      id: 42,
      source: 'source-1',
      data: { productId: 42 },
      type: 'card.requested',
    });

    await Promise.resolve();
    expect(processorService.handleCardIssuedEvent).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1000);
    expect(processorService.handleCardIssuedEvent).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(2000);
    expect(processorService.handleCardIssuedEvent).toHaveBeenCalledTimes(3);

    await jest.advanceTimersByTimeAsync(3999);
    expect(processorService.handleCardIssuedEvent).toHaveBeenCalledTimes(3);

    await jest.advanceTimersByTimeAsync(1);
    await processingPromise;

    expect(processorService.handleCardIssuedEvent).toHaveBeenCalledTimes(4);
    expect(kafkaService.sendMessage).not.toHaveBeenCalled();
  });

  it('publishes to the dlq after max retries are exhausted', async () => {
    process.env.KAFKA_PROCESSOR_MAX_RETRIES = '3';
    jest.useFakeTimers();

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

    const processingPromise = (consumer as any).processWithRetry({
      id: 42,
      source: 'source-1',
      data: { productId: 42 },
      type: 'card.requested',
    });

    await Promise.resolve();
    expect(processorService.handleCardIssuedEvent).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1000);
    expect(processorService.handleCardIssuedEvent).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(2000);
    expect(processorService.handleCardIssuedEvent).toHaveBeenCalledTimes(3);

    await processingPromise;

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
