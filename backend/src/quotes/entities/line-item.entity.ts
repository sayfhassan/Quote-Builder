import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Section } from './section.entity';

@Entity('line_items')
export class LineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sectionId: string;

  @ManyToOne(() => Section, (section) => section.lineItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sectionId' })
  section: Section;

  @Column()
  description: string;

  @Column({ type: 'float', default: 1 })
  quantity: number;

  @Column({ type: 'float', default: 0 })
  unitPrice: number;

  @Column({ type: 'int', default: 0 })
  position: number;
}
