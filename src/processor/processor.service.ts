import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { ProductRepository } from '../database/repositories/product.repository';
import { CARDS_ISSUED_TOPIC } from '../kafka/kafka.constants';
import {
  generateCardCVC,
  generateCardNumber,
  generateFutureExpirationDate,
  getRandomInt,
  SimulatedCardPayload,
  sleep,
} from './processor.helper';
import { ProductStatus } from '../database/entities/product.entity';
import { CardEvent } from '../kafka/interfaces/card-event.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class ProcessorService {
  private readonly logger = new Logger(ProcessorService.name);
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly productRepository: ProductRepository,
  ) {}

  async handleCardIssuedEvent(
    event: CardEvent,
    amountOfTries: number,
  ): Promise<void> {
    try {
      if (event.data.forceError) {
        throw new Error('Unable to issue card');
      }

      const foundProduct = await this.productRepository.findById(event.id);
      if (!foundProduct) {
        this.logger.error(`Product with id ${event.id} not found`);
        return;
      }

      const issuedCard = await this.issueCard();
      foundProduct.metadata = { ...issuedCard, amount_of_tries: amountOfTries };
      foundProduct.status = ProductStatus.ISSUED;

      await this.productRepository.update(foundProduct.id, foundProduct);

      this.logger.log(
        `Card issued successfully for product ${foundProduct.id}`,
      );

      await this.kafkaService.sendMessage({
        topic: CARDS_ISSUED_TOPIC,
        value: JSON.stringify({
          id: event.id,
          source: randomUUID(),
          data: { productId: foundProduct.id },
          type: 'card.issued',
        } satisfies CardEvent),
      });
    } catch (error) {
      this.logger.error(
        `Card issuance process failed for product ${event.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
  async issueCard(): Promise<SimulatedCardPayload> {
    const delayMs = getRandomInt(200, 500);
    await sleep(delayMs);

    const didSucceed = Math.random() >= 0.5;
    if (!didSucceed) {
      throw new Error(`External call failed after ${delayMs}ms`);
    }

    return {
      card_number: generateCardNumber(),
      card_expiration_date: generateFutureExpirationDate(),
      card_cvc: generateCardCVC(),
    };
  }
}
