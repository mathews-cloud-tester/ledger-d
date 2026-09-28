import assert from "node:assert/strict";
import { test } from "node:test";
import { createInvoice, listInvoices, validateInvoice } from "../src/api/invoices.ts";

test("creates an invoice with the region fee", () => {
  const response = createInvoice({ customerId: "c_1", amount: 100_000, region: "eu-west" });
  assert.equal(response.status, 201);
  assert.equal(response.body.fee, 250);
  assert.equal(listInvoices().status, 200);
});

test("trims the customerId before storing", () => {
  const response = createInvoice({ customerId: "  c_trim  ", amount: 1_000 });
  assert.equal(response.status, 201);
  assert.equal(response.body.customerId, "c_trim");
});

test("applies default region and currency", () => {
  const response = createInvoice({ customerId: "c_defaults", amount: 1_000 });
  assert.equal(response.status, 201);
  assert.equal(response.body.currency, "EUR");
  assert.equal(response.body.memo, "");
});

test("rejects a non-numeric amount", () => {
  const response = createInvoice({ customerId: "c_2", amount: "12" as unknown as number });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "amount must be a number");
});

test("rejects a missing amount", () => {
  const response = createInvoice({ customerId: "c_3" });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "amount is required");
});

test("rejects a NaN amount", () => {
  const response = createInvoice({ customerId: "c_nan", amount: Number.NaN });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "amount must be a number");
});

test("rejects a non-integer amount", () => {
  const response = createInvoice({ customerId: "c_frac", amount: 10.5 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "amount must be an integer number of minor units");
});

test("rejects a non-positive amount", () => {
  assert.equal(createInvoice({ customerId: "c_zero", amount: 0 }).status, 400);
  const negative = createInvoice({ customerId: "c_neg", amount: -100 });
  assert.equal(negative.status, 400);
  assert.equal(negative.body.error, "amount must be greater than 0");
});

test("rejects an infinite amount", () => {
  const response = createInvoice({
    customerId: "c_inf",
    amount: Number.POSITIVE_INFINITY,
  });
  assert.equal(response.status, 400);
});

test("rejects a missing customerId without throwing", () => {
  const response = createInvoice({ amount: 1_000 } as never);
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "customerId is required");
});

test("rejects an empty or whitespace customerId", () => {
  assert.equal(createInvoice({ customerId: "", amount: 1_000 }).status, 400);
  const response = createInvoice({ customerId: "   ", amount: 1_000 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "customerId must not be empty");
});

test("rejects a non-string customerId", () => {
  const response = createInvoice({ customerId: 5 as unknown as string, amount: 1_000 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "customerId must be a string");
});

test("rejects an unknown region", () => {
  const response = createInvoice({ customerId: "c_4", amount: 1_000, region: "mars-1" });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'region "mars-1" has no fee schedule');
});

test("accepts every known region", () => {
  for (const region of ["eu-west", "us-east", "ap-south"]) {
    const response = createInvoice({ customerId: "c_region", amount: 1_000, region });
    assert.equal(response.status, 201, `expected ${region} to be accepted`);
  }
});

test("rejects an invalid currency code", () => {
  assert.equal(createInvoice({ customerId: "c_5", amount: 1_000, currency: "usd" }).status, 400);
  assert.equal(createInvoice({ customerId: "c_6", amount: 1_000, currency: "US" }).status, 400);
  const response = createInvoice({ customerId: "c_7", amount: 1_000, currency: "DOLLARS" });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "currency must be a 3-letter ISO 4217 code");
});

test("accepts a valid currency code", () => {
  const response = createInvoice({ customerId: "c_8", amount: 1_000, currency: "USD" });
  assert.equal(response.status, 201);
  assert.equal(response.body.currency, "USD");
});

test("rejects a non-string memo and an over-long memo", () => {
  assert.equal(createInvoice({ customerId: "c_9", amount: 1_000, memo: 5 as unknown as string }).status, 400);
  const response = createInvoice({
    customerId: "c_10",
    amount: 1_000,
    memo: "x".repeat(501),
  });
  assert.equal(response.status, 400);
});

test("rejects a non-object body", () => {
  assert.equal(createInvoice(null as never).status, 400);
  assert.equal(createInvoice([] as never).status, 400);
  const response = createInvoice("nope" as never);
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "request body must be a JSON object");
});

test("validateInvoice returns null for a valid body", () => {
  assert.equal(validateInvoice({ customerId: "c_ok", amount: 1_000 }), null);
});
