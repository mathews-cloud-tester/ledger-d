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

test("rejects a missing customerId", () => {
  const response = createInvoice({ amount: 100 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "customerId is required");
});

test("rejects an empty customerId", () => {
  const response = createInvoice({ customerId: "   ", amount: 100 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "customerId must not be empty");
});

test("rejects a missing amount", () => {
  const response = createInvoice({ customerId: "c_3" });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "amount is required");
});

test("rejects a negative amount", () => {
  const response = createInvoice({ customerId: "c_4", amount: -100 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "amount must not be negative");
});

test("rejects a non-integer amount", () => {
  const response = createInvoice({ customerId: "c_5", amount: 10.5 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "amount must be an integer in minor units");
});

test("rejects a non-finite amount", () => {
  const response = createInvoice({ customerId: "c_6", amount: Number.POSITIVE_INFINITY });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "amount must be a finite number");
});

test("rejects an invalid currency", () => {
  const response = createInvoice({ customerId: "c_7", amount: 100, currency: "euro" });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "currency must be a 3-letter ISO 4217 code");
});

test("rejects an unknown region", () => {
  const response = createInvoice({ customerId: "c_8", amount: 100, region: "mars" });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "unknown region: mars");
});

test("rejects a non-string memo", () => {
  const response = createInvoice({ customerId: "c_9", amount: 100, memo: 42 as unknown as string });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "memo must be a string");
});

test("accepts a valid invoice with a zero amount", () => {
  const response = createInvoice({ customerId: "c_10", amount: 0, currency: "USD", region: "us-east" });
  assert.equal(response.status, 201);
  assert.equal(response.body.currency, "USD");
  assert.equal(response.body.fee, 0);
});
