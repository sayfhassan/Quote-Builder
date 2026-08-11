import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Quote } from './quote.entity';
import { LineItem } from './line-item.entity';

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quoteId: string;

  @ManyToOne(() => Quote, (quote) => quote.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quoteId' })
  quote: Quote;

  @Column()
  name: string;

  @Column({ type: 'float', nullable: true, default: 0 })
  markupPercent: number;

  @Column({ type: 'int', default: 0 })
  position: number;

  @OneToMany(() => LineItem, (lineItem) => lineItem.section, {
    cascade: true,
  })
  lineItems: LineItem[];
}
