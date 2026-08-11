import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Organization } from './organizations/organization.entity';
import { User } from './users/user.entity';
import { Quote } from './quotes/entities/quote.entity';
import { Section } from './quotes/entities/section.entity';
import { LineItem } from './quotes/entities/line-item.entity';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DATABASE_PATH ?? 'data/dev.sqlite3',
  entities: [Organization, User, Quote, Section, LineItem],
  synchronize: true,
});
