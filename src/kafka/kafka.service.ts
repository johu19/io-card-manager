import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import {
  Consumer,
  ConsumerRunConfig,
  Kafka,
  KafkaConfig,
  logLevel,
  Producer,
} from 'kafkajs';
import { getRequiredEnv } from '../config/env';

@Injectable()
export class KafkaService implements OnApplicationShutdown {
  private readonly logger = new Logger(KafkaService.name);
  private readonly kafka: Kafka;
  private producer: Producer | null = null;
  private producerConnected = false;
  private readonly consumers = new Set<Consumer>();
  private readonly enabled: boolean;

  constructor() {
    this.enabled =
      process.env.KAFKA_ENABLED !== 'false' && process.env.NODE_ENV !== 'test';

    const clientId = getRequiredEnv('KAFKA_CLIENT_ID');
    const brokers = getRequiredEnv('KAFKA_BROKERS')
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean);

    const config: KafkaConfig = {
      clientId,
      brokers,
      logLevel: logLevel.NOTHING,
    };

    this.kafka = new Kafka(config);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async sendMessage(params: {
    topic: string;
    value: string;
  }): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug(`Kafka disabled, skipping publish to ${params.topic}`);
      return false;
    }

    try {
      const producer = await this.getProducer();

      await producer.send({
        topic: params.topic,
        messages: [
          {
            value: params.value,
          },
        ],
      });

      this.logger.log(`Sucessfully published to kafka topic ${params.topic}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to publish message to topic ${params.topic}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async registerConsumer(params: {
    groupId: string;
    topic: string;
    runConfig: ConsumerRunConfig;
  }): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug(
        `Kafka disabled, skipping consumer for ${params.topic}`,
      );
      return false;
    }

    const consumer = this.kafka.consumer({ groupId: params.groupId });
    this.consumers.add(consumer);

    try {
      await consumer.connect();
      await consumer.subscribe({ topic: params.topic, fromBeginning: false });
      await consumer.run(params.runConfig);
      return true;
    } catch (error) {
      this.consumers.delete(consumer);
      await this.disconnectConsumer(consumer);
      this.logger.error(
        `Failed to start consumer for topic ${params.topic}`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.all([
      this.disconnectProducer(),
      ...Array.from(this.consumers, (consumer) =>
        this.disconnectConsumer(consumer),
      ),
    ]);
  }

  private async getProducer(): Promise<Producer> {
    if (!this.producer) {
      this.producer = this.kafka.producer();
    }

    if (!this.producerConnected) {
      await this.producer.connect();
      this.producerConnected = true;
    }

    return this.producer;
  }

  private async disconnectProducer(): Promise<void> {
    if (!this.producer || !this.producerConnected) {
      return;
    }

    try {
      await this.producer.disconnect();
    } finally {
      this.producerConnected = false;
      this.producer = null;
    }
  }

  private async disconnectConsumer(consumer: Consumer): Promise<void> {
    try {
      await consumer.disconnect();
    } catch (error) {
      this.logger.warn(
        `Kafka consumer disconnect failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      this.consumers.delete(consumer);
    }
  }
}
