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

/** Regions with a known fee schedule; anything else has no schedule to apply. */
export const KNOWN_REGIONS = ["eu-west", "us-east", "ap-south"] as const;
const DEFAULT_REGION = "eu-west";
const DEFAULT_CURRENCY = "EUR";
/** ISO-4217-style code: exactly three uppercase letters. */
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

/**
 * Validate an incoming invoice request body. Returns a human-readable error
 * message describing the first problem found, or `null` when the body is valid.
 * The check is deliberately strict about types and formats so a bad request can
 * never reach the ledger layer (which would otherwise throw or record garbage).
 */
export function validateInvoice(body: InvoiceRequest): string | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return "request body must be a JSON object";
  }

  if (body.customerId === undefined || body.customerId === null) {
    return "customerId is required";
  }
  if (typeof body.customerId !== "string" || body.customerId.trim() === "") {
    return "customerId must be a non-empty string";
  }

  if (body.amount === undefined || body.amount === null) {
    return "amount is required";
  }
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount)) {
    return "amount must be a finite number";
  }
  if (!Number.isInteger(body.amount)) {
    return "amount must be an integer number of minor units";
  }
  if (body.amount <= 0) {
    return "amount must be greater than zero";
  }

  if (body.currency !== undefined && body.currency !== null) {
    if (typeof body.currency !== "string" || !CURRENCY_PATTERN.test(body.currency)) {
      return "currency must be a 3-letter uppercase ISO code";
    }
  }

  if (body.region !== undefined && body.region !== null) {
    if (typeof body.region !== "string") {
      return "region must be a string";
    }
    if (!(KNOWN_REGIONS as readonly string[]).includes(body.region)) {
      return `region must be one of: ${KNOWN_REGIONS.join(", ")}`;
    }
  }

  if (body.memo !== undefined && body.memo !== null && typeof body.memo !== "string") {
    return "memo must be a string";
  }

  return null;
}

export function createInvoice(body: InvoiceRequest): ApiResponse {
  const problem = validateInvoice(body);
  if (problem) return { status: 400, body: { error: problem } };

  const customerId = (body.customerId as string).trim();
  const amount = body.amount as number;
  const region = body.region ?? DEFAULT_REGION;
  const fee = applyFee(amount, feeScheduleFor(region));
  const invoice: Invoice = {
    id: `inv_${invoices.length + 1}`,
    customerId,
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
