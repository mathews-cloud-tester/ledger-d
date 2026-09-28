import { applyFee, feeScheduleFor } from "../ledger/index.ts";

export interface InvoiceRequest {
  customerId?: unknown;
  amount?: unknown;
  currency?: unknown;
  region?: unknown;
  memo?: unknown;
}

const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const MEMO_MAX_LENGTH = 500;

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

export function validateInvoice(body: InvoiceRequest): string | null {
  if (body === null || typeof body !== "object") return "request body must be a JSON object";

  if (typeof body.customerId !== "string" || body.customerId.trim() === "") {
    return "customerId is required and must be a non-empty string";
  }

  if (typeof body.amount !== "number" || !Number.isFinite(body.amount)) {
    return "amount must be a number";
  }
  if (!Number.isInteger(body.amount)) return "amount must be an integer in minor units";
  if (body.amount <= 0) return "amount must be greater than 0";

  if (body.currency !== undefined) {
    if (typeof body.currency !== "string" || !CURRENCY_PATTERN.test(body.currency)) {
      return "currency must be a three-letter uppercase ISO code";
    }
  }

  if (body.region !== undefined) {
    if (typeof body.region !== "string") return "region must be a string";
    try {
      feeScheduleFor(body.region);
    } catch {
      return `region ${body.region} is not supported`;
    }
  }

  if (body.memo !== undefined) {
    if (typeof body.memo !== "string") return "memo must be a string";
    if (body.memo.length > MEMO_MAX_LENGTH) return `memo must be at most ${MEMO_MAX_LENGTH} characters`;
  }

  return null;
}

export function createInvoice(body: InvoiceRequest): ApiResponse {
  const problem = validateInvoice(body);
  if (problem) return { status: 400, body: { error: problem } };

  const customerId = (body.customerId as string).trim();
  const amount = body.amount as number;
  const region = (body.region as string | undefined) ?? "eu-west";
  const fee = applyFee(amount, feeScheduleFor(region));
  const invoice: Invoice = {
    id: `inv_${invoices.length + 1}`,
    customerId,
    amount,
    fee,
    currency: (body.currency as string | undefined) ?? "EUR",
    memo: (body.memo as string | undefined) ?? "",
  };
  invoices.push(invoice);
  return { status: 201, body: { ...invoice } };
}

export function listInvoices(): ApiResponse {
  return { status: 200, body: { invoices: [...invoices] } };
}
