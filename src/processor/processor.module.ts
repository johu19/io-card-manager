import { Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';
import { Consumer } from './consumer';
import { ProcessorService } from './processor.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [KafkaModule, DatabaseModule.register()],
  controllers: [],
  providers: [ProcessorService, Consumer],
})
export class ProcessorModule {}
