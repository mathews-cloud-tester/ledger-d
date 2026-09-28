import { applyFee, feeScheduleFor } from "../ledger/index.ts";

const CURRENCY_PATTERN = /^[A-Z]{3}$/;

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

export function validateInvoice(body: InvoiceRequest): string | null {
  if (body === null || typeof body !== "object") return "request body must be an object";

  if (body.customerId === undefined) return "customerId is required";
  if (typeof body.customerId !== "string") return "customerId must be a string";
  if (body.customerId.trim() === "") return "customerId must not be empty";

  if (body.amount === undefined) return "amount is required";
  if (typeof body.amount !== "number") return "amount must be a number";
  if (!Number.isFinite(body.amount)) return "amount must be a finite number";
  if (!Number.isInteger(body.amount)) return "amount must be an integer in minor units";
  if (body.amount < 0) return "amount must not be negative";

  if (body.currency !== undefined) {
    if (typeof body.currency !== "string") return "currency must be a string";
    if (!CURRENCY_PATTERN.test(body.currency)) return "currency must be a 3-letter ISO 4217 code";
  }

  if (body.region !== undefined) {
    if (typeof body.region !== "string") return "region must be a string";
    try {
      feeScheduleFor(body.region);
    } catch {
      return `unknown region: ${body.region}`;
    }
  }

  if (body.memo !== undefined && typeof body.memo !== "string") return "memo must be a string";

  return null;
}

export function createInvoice(body: InvoiceRequest): ApiResponse {
  const problem = validateInvoice(body);
  if (problem) return { status: 400, body: { error: problem } };
  const region = body.region ?? "eu-west";
  const fee = applyFee(body.amount as number, feeScheduleFor(region));
  const invoice: Invoice = {
    id: `inv_${invoices.length + 1}`,
    customerId: (body.customerId as string).trim(),
    amount: body.amount as number,
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
