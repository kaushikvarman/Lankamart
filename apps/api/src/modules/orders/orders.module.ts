import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { RfqController } from './rfq.controller';
import { OrdersService } from './orders.service';
import { RfqService } from './rfq.service';

@Module({
  controllers: [OrdersController, RfqController],
  providers: [OrdersService, RfqService],
  exports: [OrdersService, RfqService],
})
export class OrdersModule {}
