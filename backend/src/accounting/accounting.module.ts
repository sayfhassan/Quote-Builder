import { Module } from '@nestjs/common';
import { FakeAccountingClient } from './accounting-client';

@Module({
  providers: [FakeAccountingClient],
  exports: [FakeAccountingClient],
})
export class AccountingModule {}
