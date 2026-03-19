import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { IssuerModule } from './issuer/issuer.module';
import { ProcessorModule } from './processor/processor.module';

@Module({
  imports: [DatabaseModule.register(), IssuerModule, ProcessorModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
