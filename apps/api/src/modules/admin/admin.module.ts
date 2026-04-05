import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { DisputeController } from './dispute.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController, DisputeController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
