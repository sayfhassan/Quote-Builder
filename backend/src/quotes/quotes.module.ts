import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './entities/quote.entity';
import { Section } from './entities/section.entity';
import { LineItem } from './entities/line-item.entity';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { UsersModule } from '../users/users.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, Section, LineItem]),
    UsersModule,
    AccountingModule,
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
