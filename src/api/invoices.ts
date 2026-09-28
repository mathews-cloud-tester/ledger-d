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

export function validateInvoice(body: unknown): string | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return "request body must be a JSON object";
  }
  const { customerId, amount, currency, region, memo } = body as InvoiceRequest;

  if (typeof customerId !== "string" || customerId.trim() === "") {
    return "customerId is required and must be a non-empty string";
  }
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "amount must be a finite number";
  }
  if (amount <= 0) {
    return "amount must be greater than zero";
  }
  if (currency !== undefined && (typeof currency !== "string" || currency.trim() === "")) {
    return "currency must be a non-empty string";
  }
  if (region !== undefined) {
    if (typeof region !== "string" || region.trim() === "") {
      return "region must be a non-empty string";
    }
    try {
      feeScheduleFor(region);
    } catch {
      return `region ${region} is not a known fee schedule region`;
    }
  }
  if (memo !== undefined && typeof memo !== "string") {
    return "memo must be a string";
  }
  return null;
}

export function createInvoice(body: unknown): ApiResponse {
  const problem = validateInvoice(body);
  if (problem) return { status: 400, body: { error: problem } };
  const request = body as InvoiceRequest;
  const customerId = (request.customerId as string).trim();
  const amount = request.amount as number;
  const region = request.region ?? "eu-west";
  const fee = applyFee(amount, feeScheduleFor(region));
  const invoice: Invoice = {
    id: `inv_${invoices.length + 1}`,
    customerId,
    amount,
    fee,
    currency: request.currency ?? "EUR",
    memo: request.memo ?? "",
  };
  invoices.push(invoice);
  return { status: 201, body: { ...invoice } };
}

export function listInvoices(): ApiResponse {
  return { status: 200, body: { invoices: [...invoices] } };
}
