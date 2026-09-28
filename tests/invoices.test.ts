import assert from "node:assert/strict";
import { test } from "node:test";
import { createInvoice, listInvoices, validateInvoice } from "../src/api/invoices.ts";

test("creates an invoice with the region fee", () => {
  const response = createInvoice({ customerId: "c_1", amount: 100_000, region: "eu-west" });
  assert.equal(response.status, 201);
  assert.equal(response.body.fee, 250);
  assert.equal(listInvoices().status, 200);
});

test("creates an invoice with defaults and trims the customerId", () => {
  const response = createInvoice({ customerId: "  c_trim  ", amount: 500 });
  assert.equal(response.status, 201);
  assert.equal(response.body.customerId, "c_trim");
  assert.equal(response.body.currency, "EUR");
  assert.equal(response.body.memo, "");
});

test("accepts an explicit currency, region, and memo", () => {
  const response = createInvoice({
    customerId: "c_full",
    amount: 200_000,
    currency: "USD",
    region: "us-east",
    memo: "March hosting",
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.currency, "USD");
  assert.equal(response.body.memo, "March hosting");
});

const invalidCases: Array<{ name: string; body: Record<string, unknown>; error: string }> = [
  { name: "missing customerId", body: { amount: 100 }, error: "customerId is required" },
  { name: "non-string customerId", body: { customerId: 7, amount: 100 }, error: "customerId must be a string" },
  { name: "empty customerId", body: { customerId: "   ", amount: 100 }, error: "customerId must not be empty" },
  { name: "missing amount", body: { customerId: "c" }, error: "amount is required" },
  { name: "non-numeric amount", body: { customerId: "c", amount: "12" }, error: "amount must be a number" },
  { name: "NaN amount", body: { customerId: "c", amount: Number.NaN }, error: "amount must be a number" },
  {
    name: "infinite amount",
    body: { customerId: "c", amount: Number.POSITIVE_INFINITY },
    error: "amount must be a finite number",
  },
  {
    name: "fractional amount",
    body: { customerId: "c", amount: 12.5 },
    error: "amount must be an integer number of minor units",
  },
  { name: "zero amount", body: { customerId: "c", amount: 0 }, error: "amount must be greater than 0" },
  { name: "negative amount", body: { customerId: "c", amount: -10 }, error: "amount must be greater than 0" },
  {
    name: "non-string currency",
    body: { customerId: "c", amount: 100, currency: 3 },
    error: "currency must be a string",
  },
  {
    name: "malformed currency",
    body: { customerId: "c", amount: 100, currency: "eur" },
    error: "currency must be a 3-letter ISO code (e.g. EUR)",
  },
  {
    name: "unsupported region",
    body: { customerId: "c", amount: 100, region: "moon-1" },
    error: "region moon-1 is not supported",
  },
  {
    name: "non-string memo",
    body: { customerId: "c", amount: 100, memo: 5 },
    error: "memo must be a string",
  },
];

for (const { name, body, error } of invalidCases) {
  test(`rejects ${name}`, () => {
    const response = createInvoice(body);
    assert.equal(response.status, 400);
    assert.equal(response.body.error, error);
    assert.equal(validateInvoice(body), error);
  });
}

test("rejects an oversized customerId", () => {
  const response = createInvoice({ customerId: "x".repeat(129), amount: 100 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "customerId must be at most 128 characters");
});

test("rejects an oversized memo", () => {
  const response = createInvoice({ customerId: "c", amount: 100, memo: "m".repeat(513) });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "memo must be at most 512 characters");
});

test("rejects a non-object body", () => {
  assert.equal(validateInvoice(null as never), "request body must be a JSON object");
  assert.equal(validateInvoice("nope" as never), "request body must be a JSON object");
});
