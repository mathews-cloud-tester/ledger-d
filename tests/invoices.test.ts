import assert from "node:assert/strict";
import { test } from "node:test";
import { createInvoice, listInvoices } from "../src/api/invoices.ts";

test("creates an invoice with the region fee", () => {
  const response = createInvoice({ customerId: "c_1", amount: 100_000, region: "eu-west" });
  assert.equal(response.status, 201);
  assert.equal(response.body.fee, 250);
  assert.equal(listInvoices().status, 200);
});

test("rejects a non-numeric amount", () => {
  const response = createInvoice({ customerId: "c_2", amount: "12" as unknown as number });
  assert.equal(response.status, 400);
});

test("trims customerId and applies defaults", () => {
  const response = createInvoice({ customerId: "  c_3  ", amount: 5_000 });
  assert.equal(response.status, 201);
  assert.equal(response.body.customerId, "c_3");
  assert.equal(response.body.currency, "EUR");
  assert.equal(response.body.memo, "");
});

test("rejects a missing customerId without throwing", () => {
  const response = createInvoice({ amount: 100 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "customerId is required");
});

test("rejects a non-string customerId", () => {
  const response = createInvoice({ customerId: 42 as unknown as string, amount: 100 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "customerId must be a string");
});

test("rejects an empty/whitespace customerId", () => {
  const response = createInvoice({ customerId: "   ", amount: 100 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "customerId must not be empty");
});

test("rejects a missing amount", () => {
  const response = createInvoice({ customerId: "c_4" });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "amount is required");
});

test("rejects a non-integer amount", () => {
  const response = createInvoice({ customerId: "c_5", amount: 12.5 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "amount must be an integer in minor units");
});

test("rejects a non-finite amount", () => {
  const response = createInvoice({ customerId: "c_6", amount: Number.POSITIVE_INFINITY });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "amount must be a finite number");
});

test("rejects a zero or negative amount", () => {
  assert.equal(createInvoice({ customerId: "c_7", amount: 0 }).status, 400);
  assert.equal(createInvoice({ customerId: "c_7", amount: -100 }).status, 400);
});

test("rejects an unsafely large amount", () => {
  const response = createInvoice({ customerId: "c_8", amount: Number.MAX_SAFE_INTEGER + 2 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "amount is too large");
});

test("rejects a malformed currency", () => {
  const response = createInvoice({ customerId: "c_9", amount: 100, currency: "eur" });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "currency must be a 3-letter ISO 4217 code");
});

test("accepts a valid currency", () => {
  const response = createInvoice({ customerId: "c_10", amount: 100, currency: "USD" });
  assert.equal(response.status, 201);
  assert.equal(response.body.currency, "USD");
});

test("rejects an unknown region", () => {
  const response = createInvoice({ customerId: "c_11", amount: 100, region: "mars-1" });
  assert.equal(response.status, 400);
  assert.match(response.body.error as string, /^region must be one of/);
});

test("rejects a non-string memo and an over-long memo", () => {
  assert.equal(createInvoice({ customerId: "c_12", amount: 100, memo: 1 as unknown as string }).status, 400);
  assert.equal(createInvoice({ customerId: "c_12", amount: 100, memo: "x".repeat(501) }).status, 400);
});

test("rejects a non-object body without throwing", () => {
  const response = createInvoice(null as unknown as Parameters<typeof createInvoice>[0]);
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "request body must be an object");
});
