import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesModule } from './quotes/quotes.module';
import { UsersModule } from './users/users.module';
import { AccountingModule } from './accounting/accounting.module';
import { OrganizationsModule } from './organizations/organizations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_PATH ?? 'data/dev.sqlite3',
      autoLoadEntities: true,
      synchronize: true,
    }),
    OrganizationsModule,
    UsersModule,
    QuotesModule,
    AccountingModule,
  ],
})
export class AppModule {}
