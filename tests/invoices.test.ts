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

test("accepts an invoice with currency, memo, and default region", () => {
  const response = createInvoice({ customerId: "c_ok", amount: 5000, currency: "USD", memo: "March" });
  assert.equal(response.status, 201);
  assert.equal(response.body.currency, "USD");
  assert.equal(response.body.memo, "March");
});

test("rejects a missing customerId", () => {
  const response = createInvoice({ amount: 1000 } as never);
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /customerId/);
});

test("rejects a blank customerId", () => {
  const response = createInvoice({ customerId: "   ", amount: 1000 });
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /customerId/);
});

test("rejects a missing amount", () => {
  const response = createInvoice({ customerId: "c_3" } as never);
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /amount/);
});

test("rejects a zero or negative amount", () => {
  assert.equal(createInvoice({ customerId: "c_4", amount: 0 }).status, 400);
  assert.equal(createInvoice({ customerId: "c_5", amount: -100 }).status, 400);
});

test("rejects a non-integer amount", () => {
  const response = createInvoice({ customerId: "c_6", amount: 12.5 });
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /integer/);
});

test("rejects a non-finite amount", () => {
  const response = createInvoice({ customerId: "c_7", amount: Number.POSITIVE_INFINITY });
  assert.equal(response.status, 400);
});

test("rejects a malformed currency", () => {
  const response = createInvoice({ customerId: "c_8", amount: 1000, currency: "dollars" });
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /currency/);
});

test("rejects an unsupported region", () => {
  const response = createInvoice({ customerId: "c_9", amount: 1000, region: "mars-north" });
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /region/);
});

test("rejects a non-string memo", () => {
  const response = createInvoice({ customerId: "c_10", amount: 1000, memo: 42 as unknown as string });
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /memo/);
});

test("rejects a non-object body", () => {
  const response = createInvoice(null as never);
  assert.equal(response.status, 400);
});
