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

const MAX_MEMO_LENGTH = 500;
const DEFAULT_REGION = "eu-west";
const DEFAULT_CURRENCY = "EUR";

function isKnownRegion(region: string): boolean {
  try {
    feeScheduleFor(region);
    return true;
  } catch {
    return false;
  }
}

export function validateInvoice(body: InvoiceRequest): string | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return "request body must be a JSON object";
  }

  if (body.customerId === undefined || body.customerId === null) {
    return "customerId is required";
  }
  if (typeof body.customerId !== "string") return "customerId must be a string";
  if (body.customerId.trim().length === 0) return "customerId must not be empty";

  if (body.amount === undefined || body.amount === null) return "amount is required";
  if (typeof body.amount !== "number" || Number.isNaN(body.amount)) {
    return "amount must be a number";
  }
  if (!Number.isFinite(body.amount)) return "amount must be a finite number";
  if (!Number.isInteger(body.amount)) {
    return "amount must be an integer number of minor units";
  }
  if (body.amount <= 0) return "amount must be greater than 0";
  if (body.amount > Number.MAX_SAFE_INTEGER) return "amount is too large";

  if (body.currency !== undefined && body.currency !== null) {
    if (typeof body.currency !== "string") return "currency must be a string";
    if (!/^[A-Z]{3}$/.test(body.currency)) {
      return "currency must be a 3-letter ISO 4217 code";
    }
  }

  if (body.region !== undefined && body.region !== null) {
    if (typeof body.region !== "string") return "region must be a string";
    if (!isKnownRegion(body.region)) {
      return `region "${body.region}" has no fee schedule`;
    }
  }

  if (body.memo !== undefined && body.memo !== null) {
    if (typeof body.memo !== "string") return "memo must be a string";
    if (body.memo.length > MAX_MEMO_LENGTH) {
      return `memo must be at most ${MAX_MEMO_LENGTH} characters`;
    }
  }

  return null;
}

export function createInvoice(body: InvoiceRequest): ApiResponse {
  const problem = validateInvoice(body);
  if (problem) return { status: 400, body: { error: problem } };
  const region = body.region ?? DEFAULT_REGION;
  const amount = body.amount as number;
  const fee = applyFee(amount, feeScheduleFor(region));
  const invoice: Invoice = {
    id: `inv_${invoices.length + 1}`,
    customerId: (body.customerId as string).trim(),
    amount,
    fee,
    currency: body.currency ?? DEFAULT_CURRENCY,
    memo: body.memo ?? "",
  };
  invoices.push(invoice);
  return { status: 201, body: { ...invoice } };
}

export function listInvoices(): ApiResponse {
  return { status: 200, body: { invoices: [...invoices] } };
}
