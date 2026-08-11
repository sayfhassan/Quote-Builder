import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface CreateInvoicePayload {
  quoteId: string;
  customerName: string;
  total: number;
}

export interface CreateInvoiceResult {
  externalId: string;
}

const FAILURE_RATE = 0.3;
const SIMULATED_LATENCY_MS = 250;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stand-in for an external accounting system's POST /invoices. Slow and
 * flaky on purpose (~30% failure rate) so callers are forced to handle
 * retries safely — that's the point of this exercise's optional section.
 */
@Injectable()
export class FakeAccountingClient {
  async createInvoice(
    payload: CreateInvoicePayload,
  ): Promise<CreateInvoiceResult> {
    await delay(SIMULATED_LATENCY_MS);

    if (Math.random() < FAILURE_RATE) {
      throw new InternalServerErrorException(
        'Accounting system is temporarily unavailable',
      );
    }

    return { externalId: `ext_${randomUUID()}` };
  }
}
