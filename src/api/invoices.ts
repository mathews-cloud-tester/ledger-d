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
const MAX_MEMO_LENGTH = 500;
const ALLOWED_FIELDS: ReadonlySet<string> = new Set([
  "customerId",
  "amount",
  "currency",
  "region",
  "memo",
]);

/**
 * Validates a create-invoice request body. Returns a human-readable error
 * message describing the first problem found, or `null` when the body is a
 * well-formed invoice request.
 */
export function validateInvoice(body: unknown): string | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return "request body must be a JSON object";
  }
  const input = body as Record<string, unknown>;

  for (const key of Object.keys(input)) {
    if (!ALLOWED_FIELDS.has(key)) return `unexpected field: ${key}`;
  }

  if (input.customerId === undefined) return "customerId is required";
  if (typeof input.customerId !== "string") return "customerId must be a string";
  if (input.customerId.trim() === "") return "customerId must not be empty";

  if (input.amount === undefined) return "amount is required";
  if (typeof input.amount !== "number" || !Number.isFinite(input.amount)) {
    return "amount must be a finite number";
  }
  if (!Number.isInteger(input.amount)) return "amount must be an integer number of minor units";
  if (input.amount <= 0) return "amount must be greater than zero";

  if (input.currency !== undefined) {
    if (typeof input.currency !== "string") return "currency must be a string";
    if (!/^[A-Z]{3}$/.test(input.currency)) return "currency must be a 3-letter ISO 4217 code";
  }

  if (input.region !== undefined && typeof input.region !== "string") {
    return "region must be a string";
  }
  const region = typeof input.region === "string" ? input.region : DEFAULT_REGION;
  try {
    feeScheduleFor(region);
  } catch {
    return `unknown region: ${region}`;
  }

  if (input.memo !== undefined) {
    if (typeof input.memo !== "string") return "memo must be a string";
    if (input.memo.length > MAX_MEMO_LENGTH) {
      return `memo must be at most ${MAX_MEMO_LENGTH} characters`;
    }
  }

  return null;
}

export function createInvoice(body: unknown): ApiResponse {
  const problem = validateInvoice(body);
  if (problem) return { status: 400, body: { error: problem } };

  const input = body as InvoiceRequest;
  const amount = input.amount as number;
  const region = input.region ?? DEFAULT_REGION;
  const fee = applyFee(amount, feeScheduleFor(region));
  const invoice: Invoice = {
    id: `inv_${invoices.length + 1}`,
    customerId: (input.customerId as string).trim(),
    amount,
    fee,
    currency: input.currency ?? DEFAULT_CURRENCY,
    memo: input.memo ?? "",
  };
  invoices.push(invoice);
  return { status: 201, body: { ...invoice } };
}

export function listInvoices(): ApiResponse {
  return { status: 200, body: { invoices: [...invoices] } };
}
