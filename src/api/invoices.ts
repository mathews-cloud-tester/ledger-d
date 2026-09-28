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

const MEMO_MAX_LENGTH = 500;

export function validateInvoice(body: InvoiceRequest): string | null {
  if (typeof body.customerId !== "string" || body.customerId.trim() === "") {
    return "customerId is required";
  }

  if (typeof body.amount !== "number") return "amount must be a number";
  if (!Number.isFinite(body.amount)) return "amount must be a finite number";
  if (!Number.isInteger(body.amount)) return "amount must be an integer in minor units";
  if (body.amount <= 0) return "amount must be a positive integer in minor units";

  if (body.currency !== undefined) {
    if (typeof body.currency !== "string" || !/^[A-Z]{3}$/.test(body.currency)) {
      return "currency must be a 3-letter ISO code";
    }
  }

  if (body.region !== undefined) {
    if (typeof body.region !== "string") return "region must be a string";
    try {
      feeScheduleFor(body.region);
    } catch {
      return `unknown region: ${body.region}`;
    }
  }

  if (body.memo !== undefined) {
    if (typeof body.memo !== "string") return "memo must be a string";
    if (body.memo.length > MEMO_MAX_LENGTH) {
      return `memo must be at most ${MEMO_MAX_LENGTH} characters`;
    }
  }

  return null;
}

export function createInvoice(body: InvoiceRequest): ApiResponse {
  const problem = validateInvoice(body);
  if (problem) return { status: 400, body: { error: problem } };

  const customerId = (body.customerId as string).trim();
  const region = body.region ?? "eu-west";
  const fee = applyFee(body.amount as number, feeScheduleFor(region));
  const invoice: Invoice = {
    id: `inv_${invoices.length + 1}`,
    customerId,
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
