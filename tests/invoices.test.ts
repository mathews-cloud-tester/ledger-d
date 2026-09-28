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

test("rejects a non-object body", () => {
  for (const bad of [null, undefined, 42, "nope", [] as unknown]) {
    const response = createInvoice(bad);
    assert.equal(response.status, 400);
    assert.match(response.body.error as string, /JSON object/);
  }
});

test("rejects a missing customerId without throwing", () => {
  const response = createInvoice({ amount: 100 });
  assert.equal(response.status, 400);
  assert.match(response.body.error as string, /customerId/);
});

test("rejects an empty or whitespace customerId", () => {
  assert.equal(createInvoice({ customerId: "", amount: 100 }).status, 400);
  assert.equal(createInvoice({ customerId: "   ", amount: 100 }).status, 400);
});

test("rejects a missing amount", () => {
  const response = createInvoice({ customerId: "c_3" });
  assert.equal(response.status, 400);
  assert.match(response.body.error as string, /amount/);
});

test("rejects non-finite amounts", () => {
  for (const amount of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    const response = createInvoice({ customerId: "c_4", amount });
    assert.equal(response.status, 400);
  }
});

test("rejects zero and negative amounts", () => {
  assert.equal(createInvoice({ customerId: "c_5", amount: 0 }).status, 400);
  assert.equal(createInvoice({ customerId: "c_5", amount: -10 }).status, 400);
});

test("rejects a non-string or empty currency", () => {
  assert.equal(createInvoice({ customerId: "c_6", amount: 100, currency: 7 as unknown as string }).status, 400);
  assert.equal(createInvoice({ customerId: "c_6", amount: 100, currency: "" }).status, 400);
});

test("rejects a non-string region and an unknown region", () => {
  assert.equal(createInvoice({ customerId: "c_7", amount: 100, region: 9 as unknown as string }).status, 400);
  const unknown = createInvoice({ customerId: "c_7", amount: 100, region: "mars" });
  assert.equal(unknown.status, 400);
  assert.match(unknown.body.error as string, /region/);
});

test("rejects a non-string memo", () => {
  const response = createInvoice({ customerId: "c_8", amount: 100, memo: 5 as unknown as string });
  assert.equal(response.status, 400);
});

test("accepts a fully specified valid invoice", () => {
  const response = createInvoice({
    customerId: "c_9",
    amount: 200_000,
    currency: "USD",
    region: "us-east",
    memo: "quarterly",
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.customerId, "c_9");
  assert.equal(response.body.currency, "USD");
  assert.equal(response.body.memo, "quarterly");
  assert.equal(response.body.fee, 600);
});

test("applies defaults for optional fields on a minimal valid invoice", () => {
  const response = createInvoice({ customerId: "  c_10  ", amount: 100 });
  assert.equal(response.status, 201);
  assert.equal(response.body.customerId, "c_10");
  assert.equal(response.body.currency, "EUR");
  assert.equal(response.body.memo, "");
});
