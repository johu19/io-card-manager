import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getRequiredEnv, getRequiredNumberEnv } from '../config/env';
import {
  CARD_ISSUANCE_TOPIC,
  CARD_ISSUANCE_DLQ_TOPIC,
} from '../kafka/kafka.constants';
import { KafkaService } from '../kafka/kafka.service';
import { CardEvent } from '../kafka/interfaces/card-event.interface';
import { ProcessorService } from './processor.service';

@Injectable()
export class Consumer implements OnModuleInit {
  private readonly logger = new Logger(Consumer.name);
  private readonly maxRetries = getRequiredNumberEnv(
    'KAFKA_PROCESSOR_MAX_RETRIES',
  );

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly processorService: ProcessorService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafkaService.registerConsumer({
      groupId: getRequiredEnv('KAFKA_PROCESSOR_GROUP_ID'),
      topic: CARD_ISSUANCE_TOPIC,
      runConfig: {
        eachMessage: async ({ message }) => {
          if (!message.value) {
            return;
          }
          const event = JSON.parse(message.value.toString()) as CardEvent;
          await this.processWithRetry(event);
        },
      },
    });
  }

  private async processWithRetry(event: CardEvent): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt += 1) {
      try {
        await this.processorService.handleCardIssuedEvent(event, attempt);
        return;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Processing event ${event.id} failed on attempt ${attempt}/${this.maxRetries}`,
        );
      }
    }

    const dlqEvent = { ...event } as CardEvent;
    dlqEvent.type = 'card.issuance_failed';
    dlqEvent.data.error = {
      attempts: this.maxRetries,
      message:
        lastError instanceof Error ? lastError.message : String(lastError),
    };

    await this.kafkaService.sendMessage({
      topic: CARD_ISSUANCE_DLQ_TOPIC,
      value: JSON.stringify(dlqEvent satisfies CardEvent),
    });
  }
}
