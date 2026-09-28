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

test("accepts optional currency, region, and memo", () => {
  const response = createInvoice({
    customerId: "c_3",
    amount: 5_000,
    currency: "USD",
    region: "us-east",
    memo: "March hosting",
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.currency, "USD");
  assert.equal(response.body.memo, "March hosting");
});

test("defaults currency, region, and memo when omitted", () => {
  const response = createInvoice({ customerId: "c_4", amount: 1_000 });
  assert.equal(response.status, 201);
  assert.equal(response.body.currency, "EUR");
  assert.equal(response.body.memo, "");
});

test("rejects a non-object body", () => {
  for (const body of [null, undefined, 42, "invoice", [] as unknown]) {
    const response = createInvoice(body);
    assert.equal(response.status, 400);
    assert.equal(response.body.error, "request body must be a JSON object");
  }
});

test("rejects a missing customerId without throwing", () => {
  const response = createInvoice({ amount: 100 });
  assert.equal(response.status, 400);
  assert.match(response.body.error as string, /customerId/);
});

test("rejects a non-string customerId", () => {
  const response = createInvoice({ customerId: 7 as unknown as string, amount: 100 });
  assert.equal(response.status, 400);
});

test("rejects an empty or whitespace customerId", () => {
  assert.equal(createInvoice({ customerId: "", amount: 100 }).status, 400);
  assert.equal(createInvoice({ customerId: "   ", amount: 100 }).status, 400);
});

test("rejects a missing amount", () => {
  const response = createInvoice({ customerId: "c_5" });
  assert.equal(response.status, 400);
});

test("rejects non-positive, non-integer, and non-finite amounts", () => {
  assert.equal(createInvoice({ customerId: "c_6", amount: 0 }).status, 400);
  assert.equal(createInvoice({ customerId: "c_6", amount: -100 }).status, 400);
  assert.equal(createInvoice({ customerId: "c_6", amount: 12.5 }).status, 400);
  assert.equal(createInvoice({ customerId: "c_6", amount: Number.NaN }).status, 400);
  assert.equal(createInvoice({ customerId: "c_6", amount: Number.POSITIVE_INFINITY }).status, 400);
});

test("rejects an invalid currency", () => {
  assert.equal(createInvoice({ customerId: "c_7", amount: 100, currency: "eur" }).status, 400);
  assert.equal(createInvoice({ customerId: "c_7", amount: 100, currency: "EUROS" }).status, 400);
  assert.equal(
    createInvoice({ customerId: "c_7", amount: 100, currency: 3 as unknown as string }).status,
    400,
  );
});

test("rejects an unsupported region instead of throwing", () => {
  const response = createInvoice({ customerId: "c_8", amount: 100, region: "mars-north" });
  assert.equal(response.status, 400);
  assert.match(response.body.error as string, /region/);
});

test("rejects a non-string memo and an over-long memo", () => {
  assert.equal(createInvoice({ customerId: "c_9", amount: 100, memo: 1 as unknown as string }).status, 400);
  assert.equal(createInvoice({ customerId: "c_9", amount: 100, memo: "x".repeat(501) }).status, 400);
});
