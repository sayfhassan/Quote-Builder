import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Quote } from '../quotes/entities/quote.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => Quote, (quote) => quote.organization)
  quotes: Quote[];
}
