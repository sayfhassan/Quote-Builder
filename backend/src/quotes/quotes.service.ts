import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { SectionDto } from './dto/section.dto';
import { Quote, SyncStatus } from './entities/quote.entity';
import { Section } from './entities/section.entity';
import { LineItem } from './entities/line-item.entity';
import { toQuoteResponse } from './quote-response';
import { FakeAccountingClient } from '../accounting/accounting-client';

const QUOTE_RELATIONS = ['sections', 'sections.lineItems'];

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly quotesRepository: Repository<Quote>,
    private readonly dataSource: DataSource,
    private readonly accountingClient: FakeAccountingClient,
  ) {}

  async create(user: User, dto: CreateQuoteDto) {
    const quote = this.quotesRepository.create({
      organizationId: user.organizationId,
      customerName: dto.customerName,
      status: dto.status,
      discountType: dto.discountType ?? null,
      discountValue: dto.discountValue ?? 0,
      taxRate: dto.taxRate ?? 0,
      sections: (dto.sections ?? []).map((section, sectionIndex) =>
        this.buildNewSection(section, sectionIndex),
      ),
    });

    const saved = await this.quotesRepository.save(quote);
    return this.findOne(user, saved.id);
  }

  async findAll(user: User) {
    const quotes = await this.quotesRepository.find({
      where: { organizationId: user.organizationId },
      relations: QUOTE_RELATIONS,
      order: { createdAt: 'DESC' },
    });
    return quotes.map(toQuoteResponse);
  }

  async findOne(user: User, id: string) {
    const quote = await this.getOwnedQuoteOrThrow(user, id);
    return toQuoteResponse(quote);
  }

  async update(user: User, id: string, dto: UpdateQuoteDto) {
    // Ensures the quote belongs to the caller's org before any write happens.
    await this.getOwnedQuoteOrThrow(user, id);

    await this.dataSource.transaction(async (manager) => {
      const quoteRepo = manager.getRepository(Quote);
      const sectionRepo = manager.getRepository(Section);
      const lineItemRepo = manager.getRepository(LineItem);

      const quote = await quoteRepo.findOneOrFail({
        where: { id },
        relations: QUOTE_RELATIONS,
      });

      if (dto.customerName !== undefined) quote.customerName = dto.customerName;
      if (dto.status !== undefined) quote.status = dto.status;
      if (dto.discountType !== undefined)
        quote.discountType = dto.discountType;
      if (dto.discountValue !== undefined)
        quote.discountValue = dto.discountValue;
      if (dto.taxRate !== undefined) quote.taxRate = dto.taxRate;
      await quoteRepo.save(quote);

      if (dto.sections !== undefined) {
        const existingSections = quote.sections ?? [];
        const incomingIds = new Set(
          dto.sections.filter((s) => s.id).map((s) => s.id),
        );

        const sectionsToDelete = existingSections.filter(
          (s) => !incomingIds.has(s.id),
        );
        if (sectionsToDelete.length) {
          await lineItemRepo.delete({
            sectionId: In(sectionsToDelete.map((s) => s.id)),
          });
          await sectionRepo.delete(sectionsToDelete.map((s) => s.id));
        }

        for (const [index, sectionDto] of dto.sections.entries()) {
          if (sectionDto.id) {
            const existing = existingSections.find(
              (s) => s.id === sectionDto.id,
            );
            if (!existing) {
              throw new BadRequestException(
                `Section ${sectionDto.id} does not belong to this quote`,
              );
            }
            existing.name = sectionDto.name;
            existing.markupPercent = sectionDto.markupPercent ?? 0;
            existing.position = index;
            await sectionRepo.save(existing);
            await this.reconcileLineItems(
              lineItemRepo,
              existing.id,
              existing.lineItems ?? [],
              sectionDto.lineItems,
            );
          } else {
            const created = await sectionRepo.save(
              sectionRepo.create({
                quoteId: id,
                name: sectionDto.name,
                markupPercent: sectionDto.markupPercent ?? 0,
                position: index,
              }),
            );
            await this.reconcileLineItems(
              lineItemRepo,
              created.id,
              [],
              sectionDto.lineItems,
            );
          }
        }
      }
    });

    return this.findOne(user, id);
  }

  async sync(user: User, id: string) {
    const quote = await this.getOwnedQuoteOrThrow(user, id);

    if (quote.status !== 'accepted') {
      throw new BadRequestException(
        'Only accepted quotes can be synced to accounting',
      );
    }

    // Idempotency: a previously successful sync is never repeated.
    if (quote.syncStatus === SyncStatus.SYNCED && quote.externalId) {
      return toQuoteResponse(quote);
    }

    quote.syncStatus = SyncStatus.SYNCING;
    await this.quotesRepository.save(quote);

    const response = toQuoteResponse(quote);

    try {
      const result = await this.accountingClient.createInvoice({
        quoteId: quote.id,
        customerName: quote.customerName,
        total: response.totals.total,
      });
      quote.syncStatus = SyncStatus.SYNCED;
      quote.externalId = result.externalId;
      quote.syncedAt = new Date();
    } catch (err) {
      quote.syncStatus = SyncStatus.FAILED;
      await this.quotesRepository.save(quote);
      throw err;
    }

    await this.quotesRepository.save(quote);
    return toQuoteResponse(quote);
  }

  private async getOwnedQuoteOrThrow(user: User, id: string): Promise<Quote> {
    const quote = await this.quotesRepository.findOne({
      where: { id },
      relations: QUOTE_RELATIONS,
    });
    // 404 (not 403) on cross-tenant access so we don't confirm the id exists.
    if (!quote || quote.organizationId !== user.organizationId) {
      throw new NotFoundException('Quote not found');
    }
    return quote;
  }

  private buildNewSection(dto: SectionDto, position: number): Section {
    const section = new Section();
    section.name = dto.name;
    section.markupPercent = dto.markupPercent ?? 0;
    section.position = position;
    section.lineItems = (dto.lineItems ?? []).map((item, itemIndex) => {
      const lineItem = new LineItem();
      lineItem.description = item.description;
      lineItem.quantity = item.quantity;
      lineItem.unitPrice = item.unitPrice;
      lineItem.position = itemIndex;
      return lineItem;
    });
    return section;
  }

  private async reconcileLineItems(
    lineItemRepo: Repository<LineItem>,
    sectionId: string,
    existing: LineItem[],
    incoming: SectionDto['lineItems'],
  ) {
    const incomingIds = new Set(incoming.filter((i) => i.id).map((i) => i.id));
    const toDelete = existing.filter((i) => !incomingIds.has(i.id));
    if (toDelete.length) {
      await lineItemRepo.delete(toDelete.map((i) => i.id));
    }

    for (const [index, itemDto] of incoming.entries()) {
      if (itemDto.id) {
        const found = existing.find((i) => i.id === itemDto.id);
        if (!found) {
          throw new BadRequestException(
            `Line item ${itemDto.id} does not belong to this section`,
          );
        }
        found.description = itemDto.description;
        found.quantity = itemDto.quantity;
        found.unitPrice = itemDto.unitPrice;
        found.position = index;
        await lineItemRepo.save(found);
      } else {
        await lineItemRepo.save(
          lineItemRepo.create({
            sectionId,
            description: itemDto.description,
            quantity: itemDto.quantity,
            unitPrice: itemDto.unitPrice,
            position: index,
          }),
        );
      }
    }
  }
}
