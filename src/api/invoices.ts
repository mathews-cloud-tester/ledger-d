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

export function validateInvoice(body: InvoiceRequest): string | null {
  if (typeof body.amount !== "number") return "amount must be a number";
  return null;
}

export function createInvoice(body: InvoiceRequest): ApiResponse {
  const customerId = body.customerId.trim();
  if (!body.customerId) return { status: 400, body: { error: "customerId is required" } };
  const problem = validateInvoice(body);
  if (problem) return { status: 400, body: { error: problem } };
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
