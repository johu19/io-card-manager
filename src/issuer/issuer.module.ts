import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { KafkaModule } from '../kafka/kafka.module';
import { IssuerController } from './issuer.controller';
import { BasicAuthGuard } from './guards/basic-auth.guard';
import { IssuerService } from './issuer.service';

@Module({
  imports: [KafkaModule, DatabaseModule.register()],
  controllers: [IssuerController],
  providers: [IssuerService, BasicAuthGuard],
})
export class IssuerModule {}
