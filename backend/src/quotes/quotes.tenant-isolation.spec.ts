import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { QuotesModule } from './quotes.module';
import { AccountingModule } from '../accounting/accounting.module';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';
import { QuotesService } from './quotes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('Tenant isolation (integration)', () => {
  let app: INestApplication;
  let quotesService: QuotesService;
  let orgRepo: Repository<Organization>;
  let userRepo: Repository<User>;

  let orgA: Organization;
  let orgB: Organization;
  let userA: User;
  let userB: User;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        OrganizationsModule,
        UsersModule,
        QuotesModule,
        AccountingModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    quotesService = app.get(QuotesService);
    orgRepo = app.get(getRepositoryToken(Organization));
    userRepo = app.get(getRepositoryToken(User));

    orgA = await orgRepo.save(orgRepo.create({ name: 'Org A' }));
    orgB = await orgRepo.save(orgRepo.create({ name: 'Org B' }));
    userA = await userRepo.save(
      userRepo.create({ name: 'A', email: 'a@a.test', organizationId: orgA.id }),
    );
    userB = await userRepo.save(
      userRepo.create({ name: 'B', email: 'b@b.test', organizationId: orgB.id }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets a user read a quote that belongs to their own org', async () => {
    const created = await quotesService.create(userA, {
      customerName: 'Own quote',
      sections: [],
    } as any);

    const fetched = await quotesService.findOne(userA, created.id);
    expect(fetched.customerName).toBe('Own quote');
  });

  it('404s when a user tries to read another org’s quote', async () => {
    const created = await quotesService.create(userA, {
      customerName: 'Org A quote',
      sections: [],
    } as any);

    await expect(quotesService.findOne(userB, created.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('404s when a user tries to update another org’s quote', async () => {
    const created = await quotesService.create(userA, {
      customerName: 'Org A quote 2',
      sections: [],
    } as any);

    await expect(
      quotesService.update(userB, created.id, { customerName: 'Hijacked' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);

    const stillOwned = await quotesService.findOne(userA, created.id);
    expect(stillOwned.customerName).toBe('Org A quote 2');
  });

  it('only lists quotes belonging to the caller’s org', async () => {
    await quotesService.create(userB, {
      customerName: 'Org B quote',
      sections: [],
    } as any);

    const orgAQuotes = await quotesService.findAll(userA);
    const orgBQuotes = await quotesService.findAll(userB);

    expect(orgAQuotes.every((q) => q.organizationId === orgA.id)).toBe(true);
    expect(orgBQuotes.every((q) => q.organizationId === orgB.id)).toBe(true);
    expect(orgAQuotes.some((q) => q.organizationId === orgB.id)).toBe(false);
  });
});
