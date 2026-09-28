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
const MEMO_MAX_LENGTH = 500;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateInvoice(body: InvoiceRequest): string | null {
  if (typeof body.customerId !== "string") return "customerId is required and must be a string";
  if (body.customerId.trim().length === 0) return "customerId must not be empty";

  if (typeof body.amount !== "number") return "amount must be a number";
  if (!Number.isFinite(body.amount)) return "amount must be a finite number";
  if (!Number.isInteger(body.amount)) return "amount must be an integer number of minor units";
  if (!Number.isSafeInteger(body.amount)) return "amount is too large";
  if (body.amount <= 0) return "amount must be greater than 0";

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
    if (body.memo.length > MEMO_MAX_LENGTH) return `memo must be at most ${MEMO_MAX_LENGTH} characters`;
  }

  return null;
}

export function createInvoice(body: unknown): ApiResponse {
  if (!isPlainObject(body)) {
    return { status: 400, body: { error: "request body must be a JSON object" } };
  }
  const request = body as InvoiceRequest;
  const problem = validateInvoice(request);
  if (problem) return { status: 400, body: { error: problem } };

  const customerId = (request.customerId as string).trim();
  const region = request.region ?? DEFAULT_REGION;
  const fee = applyFee(request.amount as number, feeScheduleFor(region));
  const invoice: Invoice = {
    id: `inv_${invoices.length + 1}`,
    customerId,
    amount: request.amount as number,
    fee,
    currency: request.currency ?? DEFAULT_CURRENCY,
    memo: request.memo ?? "",
  };
  invoices.push(invoice);
  return { status: 201, body: { ...invoice } };
}

export function listInvoices(): ApiResponse {
  return { status: 200, body: { invoices: [...invoices] } };
}
