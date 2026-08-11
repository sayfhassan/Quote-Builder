import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../organizations/organization.entity';
import { Section } from './section.entity';

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum SyncStatus {
  NONE = 'none',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  FAILED = 'failed',
}

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, (organization) => organization.quotes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  customerName: string;

  @Column({ type: 'text', default: QuoteStatus.DRAFT })
  status: QuoteStatus;

  @Column({ type: 'text', nullable: true })
  discountType: DiscountType | null;

  @Column({ type: 'float', default: 0 })
  discountValue: number;

  @Column({ type: 'float', default: 0 })
  taxRate: number;

  @Column({ type: 'text', default: SyncStatus.NONE })
  syncStatus: SyncStatus;

  @Column({ type: 'text', nullable: true })
  externalId: string | null;

  @Column({ type: 'datetime', nullable: true })
  syncedAt: Date | null;

  @OneToMany(() => Section, (section) => section.quote, {
    cascade: true,
  })
  sections: Section[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
