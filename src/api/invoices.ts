import { applyFee, feeScheduleFor } from "../ledger/index.ts";

export interface InvoiceRequest {
  customerId?: string;
  amount?: number;
  currency?: string;
  region?: string;
  memo?: string;
}

export interface ApiResponse {
  status: number;
  body: Record<string, unknown>;
}

export interface Invoice {
  id: string;
  customerId: string;
  amount: number;
  fee: number;
  currency: string;
  memo: string;
}

const invoices: Invoice[] = [];

/** Fields the invoice API accepts; anything else is rejected as unknown input. */
const ALLOWED_FIELDS = ["customerId", "amount", "currency", "region", "memo"] as const;
/** Amounts are minor units, so cap them well below Number.MAX_SAFE_INTEGER. */
const MAX_AMOUNT = 1_000_000_000_000;
const MAX_MEMO_LENGTH = 500;
/** ISO 4217 alphabetic currency code, e.g. EUR. */
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

/** Collects every problem with an invoice request; an empty array means it is valid. */
export function collectInvoiceErrors(body: unknown): string[] {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return ["request body must be a JSON object"];
  }
  const input = body as Record<string, unknown>;
  const errors: string[] = [];

  for (const key of Object.keys(input)) {
    if (!(ALLOWED_FIELDS as readonly string[]).includes(key)) {
      errors.push(`unknown field: ${key}`);
    }
  }

  if (input.customerId === undefined) {
    errors.push("customerId is required");
  } else if (typeof input.customerId !== "string" || input.customerId.trim() === "") {
    errors.push("customerId must be a non-empty string");
  }

  if (input.amount === undefined) {
    errors.push("amount is required");
  } else if (typeof input.amount !== "number" || !Number.isFinite(input.amount)) {
    errors.push("amount must be a number");
  } else if (!Number.isInteger(input.amount)) {
    errors.push("amount must be an integer number of minor units");
  } else if (input.amount <= 0) {
    errors.push("amount must be a positive number of minor units");
  } else if (input.amount > MAX_AMOUNT) {
    errors.push(`amount must not exceed ${MAX_AMOUNT} minor units`);
  }

  if (input.currency !== undefined) {
    if (typeof input.currency !== "string") {
      errors.push("currency must be a string");
    } else if (!CURRENCY_PATTERN.test(input.currency)) {
      errors.push("currency must be a 3-letter ISO 4217 code (e.g. EUR)");
    }
  }

  if (input.region !== undefined) {
    if (typeof input.region !== "string") {
      errors.push("region must be a string");
    } else {
      try {
        feeScheduleFor(input.region);
      } catch {
        errors.push(`region ${input.region} is not supported`);
      }
    }
  }

  if (input.memo !== undefined) {
    if (typeof input.memo !== "string") {
      errors.push("memo must be a string");
    } else if (input.memo.length > MAX_MEMO_LENGTH) {
      errors.push(`memo must be at most ${MAX_MEMO_LENGTH} characters`);
    }
  }

  return errors;
}

export function validateInvoice(body: InvoiceRequest): string | null {
  const errors = collectInvoiceErrors(body);
  return errors.length > 0 ? errors[0] : null;
}

export function createInvoice(body: InvoiceRequest): ApiResponse {
  const errors = collectInvoiceErrors(body);
  if (errors.length > 0) {
    return { status: 400, body: { error: errors[0], details: errors } };
  }
  const customerId = (body.customerId as string).trim();
  const region = body.region ?? "eu-west";
  const amount = body.amount as number;
  const fee = applyFee(amount, feeScheduleFor(region));
  const invoice: Invoice = {
    id: `inv_${invoices.length + 1}`,
    customerId,
    amount,
    fee,
    currency: body.currency ?? "EUR",
    memo: body.memo ?? "",
  };
  invoices.push(invoice);
  return { status: 201, body: { ...invoice } };
}

export function listInvoices(): ApiResponse {
  return { status: 200, body: { invoices: [...invoices] } };
}
