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

test("missing customerId returns 400 and does not throw", () => {
  const response = createInvoice({ amount: 100 } as unknown as Parameters<typeof createInvoice>[0]);
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "customerId is required");
});

test("blank customerId returns 400", () => {
  const response = createInvoice({ customerId: "   ", amount: 100 });
  assert.equal(response.status, 400);
});

test("zero amount returns 400", () => {
  const response = createInvoice({ customerId: "c_3", amount: 0 });
  assert.equal(response.status, 400);
});

test("negative amount returns 400", () => {
  const response = createInvoice({ customerId: "c_4", amount: -100 });
  assert.equal(response.status, 400);
});

test("non-integer amount returns 400", () => {
  const response = createInvoice({ customerId: "c_5", amount: 100.5 });
  assert.equal(response.status, 400);
});

test("non-finite amount returns 400", () => {
  const response = createInvoice({ customerId: "c_6", amount: Number.POSITIVE_INFINITY });
  assert.equal(response.status, 400);
});

test("unknown region returns 400", () => {
  const response = createInvoice({ customerId: "c_7", amount: 100, region: "mars-north" });
  assert.equal(response.status, 400);
});

test("malformed currency returns 400", () => {
  const response = createInvoice({ customerId: "c_8", amount: 100, currency: "euro" });
  assert.equal(response.status, 400);
});

test("over-long memo returns 400", () => {
  const response = createInvoice({ customerId: "c_9", amount: 100, memo: "x".repeat(501) });
  assert.equal(response.status, 400);
});

test("non-string memo returns 400", () => {
  const response = createInvoice({ customerId: "c_10", amount: 100, memo: 123 as unknown as string });
  assert.equal(response.status, 400);
});

test("accepts a fully-specified valid request", () => {
  const response = createInvoice({
    customerId: "c_11",
    amount: 250_000,
    currency: "USD",
    region: "us-east",
    memo: "quarterly retainer",
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.customerId, "c_11");
  assert.equal(response.body.amount, 250_000);
  assert.equal(response.body.currency, "USD");
  assert.equal(response.body.memo, "quarterly retainer");
});
