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

const DEFAULT_REGION = "eu-west";
const DEFAULT_CURRENCY = "EUR";
const KNOWN_REGIONS = ["eu-west", "us-east", "ap-south"];
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const MEMO_MAX_LENGTH = 500;

export function validateInvoice(body: InvoiceRequest): string | null {
  if (body === null || typeof body !== "object") return "request body must be an object";

  if (body.customerId === undefined) return "customerId is required";
  if (typeof body.customerId !== "string") return "customerId must be a string";
  if (body.customerId.trim().length === 0) return "customerId must not be empty";

  if (body.amount === undefined) return "amount is required";
  if (typeof body.amount !== "number") return "amount must be a number";
  if (!Number.isFinite(body.amount)) return "amount must be a finite number";
  if (!Number.isInteger(body.amount)) return "amount must be an integer in minor units";
  if (body.amount <= 0) return "amount must be greater than zero";
  if (!Number.isSafeInteger(body.amount)) return "amount is too large";

  if (body.currency !== undefined) {
    if (typeof body.currency !== "string") return "currency must be a string";
    if (!CURRENCY_PATTERN.test(body.currency)) return "currency must be a 3-letter ISO 4217 code";
  }

  if (body.region !== undefined) {
    if (typeof body.region !== "string") return "region must be a string";
    if (!KNOWN_REGIONS.includes(body.region)) return `region must be one of: ${KNOWN_REGIONS.join(", ")}`;
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
  const region = body.region ?? DEFAULT_REGION;
  const fee = applyFee(body.amount as number, feeScheduleFor(region));
  const invoice: Invoice = {
    id: `inv_${invoices.length + 1}`,
    customerId: (body.customerId as string).trim(),
    amount: body.amount as number,
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
