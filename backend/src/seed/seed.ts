import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from '../data-source';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';
import { Quote, QuoteStatus, DiscountType } from '../quotes/entities/quote.entity';
import { Section } from '../quotes/entities/section.entity';
import { LineItem } from '../quotes/entities/line-item.entity';

function section(
  name: string,
  markupPercent: number,
  lineItems: { description: string; quantity: number; unitPrice: number }[],
) {
  const s = new Section();
  s.name = name;
  s.markupPercent = markupPercent;
  s.position = 0;
  s.lineItems = lineItems.map((li, i) => {
    const item = new LineItem();
    item.description = li.description;
    item.quantity = li.quantity;
    item.unitPrice = li.unitPrice;
    item.position = i;
    return item;
  });
  return s;
}

function withPositions(sections: Section[]): Section[] {
  return sections.map((s, i) => {
    s.position = i;
    return s;
  });
}

async function seed() {
  const dbPath = process.env.DATABASE_PATH ?? 'data/dev.sqlite3';
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

  await AppDataSource.initialize();

  const orgRepo = AppDataSource.getRepository(Organization);
  const userRepo = AppDataSource.getRepository(User);
  const quoteRepo = AppDataSource.getRepository(Quote);

  const northwind = await orgRepo.save(
    orgRepo.create({ name: 'Northwind Contracting' }),
  );
  const riverside = await orgRepo.save(
    orgRepo.create({ name: 'Riverside Builders' }),
  );

  const alice = await userRepo.save(
    userRepo.create({
      name: 'Alice Johnson',
      email: 'alice@northwind.test',
      organizationId: northwind.id,
    }),
  );
  const bob = await userRepo.save(
    userRepo.create({
      name: 'Bob Lee',
      email: 'bob@northwind.test',
      organizationId: northwind.id,
    }),
  );
  const carla = await userRepo.save(
    userRepo.create({
      name: 'Carla Diaz',
      email: 'carla@riverside.test',
      organizationId: riverside.id,
    }),
  );
  const dev = await userRepo.save(
    userRepo.create({
      name: 'Dev Patel',
      email: 'dev@riverside.test',
      organizationId: riverside.id,
    }),
  );

  await quoteRepo.save(
    quoteRepo.create({
      organizationId: northwind.id,
      customerName: 'Court Street Cafe',
      status: QuoteStatus.DRAFT,
      taxRate: 8,
      sections: withPositions([
        section('Kitchen Remodel', 10, [
          { description: 'Demo old cabinets', quantity: 1, unitPrice: 450 },
          { description: 'Install new cabinets', quantity: 1, unitPrice: 3200 },
        ]),
        section('Electrical', 5, [
          { description: 'Outlet install', quantity: 4, unitPrice: 85 },
        ]),
      ]),
    }),
  );

  await quoteRepo.save(
    quoteRepo.create({
      organizationId: northwind.id,
      customerName: 'Maple Ave Office',
      status: QuoteStatus.SENT,
      taxRate: 7.5,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      sections: [
        section('General', 0, [
          { description: 'Consulting hours', quantity: 20, unitPrice: 125 },
        ]),
      ],
    }),
  );

  await quoteRepo.save(
    quoteRepo.create({
      organizationId: riverside.id,
      customerName: 'Riverside Deck Co',
      status: QuoteStatus.ACCEPTED,
      taxRate: 8,
      discountType: DiscountType.FIXED,
      discountValue: 100,
      sections: [
        section('Decking', 12, [
          { description: 'Composite boards', quantity: 40, unitPrice: 22.5 },
          { description: 'Labor', quantity: 16, unitPrice: 65 },
        ]),
      ],
    }),
  );

  await quoteRepo.save(
    quoteRepo.create({
      organizationId: riverside.id,
      customerName: 'Lakeview Homeowner',
      status: QuoteStatus.DRAFT,
      taxRate: 6,
      sections: [
        section('Fence', 8, [
          { description: 'Fence panels', quantity: 10, unitPrice: 140 },
        ]),
      ],
    }),
  );

  console.log('Seed complete.\n');
  console.log('Organizations & users (use the id as the X-User-Id header):\n');
  for (const [org, users] of [
    [northwind, [alice, bob]],
    [riverside, [carla, dev]],
  ] as const) {
    console.log(`${org.name} (${org.id})`);
    for (const u of users) {
      console.log(`  ${u.name.padEnd(14)} ${u.email.padEnd(24)} ${u.id}`);
    }
  }

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
