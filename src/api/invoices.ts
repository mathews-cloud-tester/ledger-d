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

const MAX_CUSTOMER_ID_LENGTH = 128;
const MAX_MEMO_LENGTH = 512;
const MAX_AMOUNT = Number.MAX_SAFE_INTEGER;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

/**
 * Validates an invoice request body. Returns a human-readable error message for
 * the first problem found, or `null` when the body is valid. Accepts unknown
 * input so it can defend against arbitrary JSON payloads.
 */
export function validateInvoice(body: InvoiceRequest): string | null {
  if (body === null || typeof body !== "object") return "request body must be a JSON object";

  if (body.customerId === undefined || body.customerId === null) return "customerId is required";
  if (typeof body.customerId !== "string") return "customerId must be a string";
  if (body.customerId.trim().length === 0) return "customerId must not be empty";
  if (body.customerId.length > MAX_CUSTOMER_ID_LENGTH) {
    return `customerId must be at most ${MAX_CUSTOMER_ID_LENGTH} characters`;
  }

  if (body.amount === undefined || body.amount === null) return "amount is required";
  if (typeof body.amount !== "number" || Number.isNaN(body.amount)) return "amount must be a number";
  if (!Number.isFinite(body.amount)) return "amount must be a finite number";
  if (!Number.isInteger(body.amount)) return "amount must be an integer number of minor units";
  if (body.amount <= 0) return "amount must be greater than 0";
  if (body.amount > MAX_AMOUNT) return "amount is too large";

  if (body.currency !== undefined) {
    if (typeof body.currency !== "string") return "currency must be a string";
    if (!CURRENCY_PATTERN.test(body.currency)) return "currency must be a 3-letter ISO code (e.g. EUR)";
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
    if (body.memo.length > MAX_MEMO_LENGTH) return `memo must be at most ${MAX_MEMO_LENGTH} characters`;
  }

  return null;
}

export function createInvoice(body: InvoiceRequest): ApiResponse {
  const problem = validateInvoice(body);
  if (problem) return { status: 400, body: { error: problem } };
  const region = body.region ?? "eu-west";
  const amount = body.amount as number;
  const fee = applyFee(amount, feeScheduleFor(region));
  const invoice: Invoice = {
    id: `inv_${invoices.length + 1}`,
    customerId: (body.customerId as string).trim(),
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
