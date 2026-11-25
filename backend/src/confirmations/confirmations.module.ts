import { Module } from '@nestjs/common';
import { ConfirmationsService } from './confirmations.service';
import { ConfirmationsController } from './confirmations.controller';

@Module({
  providers: [ConfirmationsService],
  controllers: [ConfirmationsController],
  exports: [ConfirmationsService],
})
export class ConfirmationsModule {}
