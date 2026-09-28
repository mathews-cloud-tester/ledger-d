import assert from "node:assert/strict";
import { test } from "node:test";
import { createInvoice, listInvoices, validateInvoice } from "../src/api/invoices.ts";

test("creates an invoice with the region fee", () => {
  const response = createInvoice({ customerId: "c_1", amount: 100_000, region: "eu-west" });
  assert.equal(response.status, 201);
  assert.equal(response.body.fee, 250);
  assert.equal(listInvoices().status, 200);
});

test("creates an invoice with defaults for optional fields", () => {
  const response = createInvoice({ customerId: "  c_defaults  ", amount: 5_000 });
  assert.equal(response.status, 201);
  assert.equal(response.body.currency, "EUR");
  assert.equal(response.body.memo, "");
  assert.equal(response.body.customerId, "c_defaults");
});

test("accepts an explicit valid currency, region, and memo", () => {
  const response = createInvoice({
    customerId: "c_full",
    amount: 12_345,
    currency: "USD",
    region: "us-east",
    memo: "March services",
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.currency, "USD");
  assert.equal(response.body.memo, "March services");
});

test("rejects a non-numeric amount", () => {
  const response = createInvoice({ customerId: "c_2", amount: "12" as unknown as number });
  assert.equal(response.status, 400);
});

test("rejects a missing customerId without throwing", () => {
  const response = createInvoice({ amount: 100 } as never);
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /customerId/);
});

test("rejects an empty or whitespace-only customerId", () => {
  assert.equal(createInvoice({ customerId: "", amount: 100 }).status, 400);
  assert.equal(createInvoice({ customerId: "   ", amount: 100 }).status, 400);
});

test("rejects a missing amount", () => {
  const response = createInvoice({ customerId: "c_3" } as never);
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /amount/);
});

test("rejects non-finite, non-integer, and non-positive amounts", () => {
  assert.equal(createInvoice({ customerId: "c", amount: Number.NaN }).status, 400);
  assert.equal(createInvoice({ customerId: "c", amount: Number.POSITIVE_INFINITY }).status, 400);
  assert.equal(createInvoice({ customerId: "c", amount: 10.5 }).status, 400);
  assert.equal(createInvoice({ customerId: "c", amount: 0 }).status, 400);
  assert.equal(createInvoice({ customerId: "c", amount: -100 }).status, 400);
});

test("rejects a malformed currency", () => {
  assert.equal(createInvoice({ customerId: "c", amount: 100, currency: "eur" }).status, 400);
  assert.equal(createInvoice({ customerId: "c", amount: 100, currency: "EURO" }).status, 400);
  assert.equal(
    createInvoice({ customerId: "c", amount: 100, currency: 42 as unknown as string }).status,
    400,
  );
});

test("rejects an unknown region instead of throwing", () => {
  const response = createInvoice({ customerId: "c", amount: 100, region: "mars-east" });
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /region/);
});

test("rejects a non-string memo", () => {
  const response = createInvoice({ customerId: "c", amount: 100, memo: 5 as unknown as string });
  assert.equal(response.status, 400);
});

test("rejects a body that is not a JSON object", () => {
  assert.equal(createInvoice(null as never).status, 400);
  assert.equal(createInvoice([] as never).status, 400);
  assert.equal(createInvoice("nope" as never).status, 400);
});

test("validateInvoice returns null for a valid body and a message otherwise", () => {
  assert.equal(validateInvoice({ customerId: "c", amount: 100 }), null);
  assert.equal(typeof validateInvoice({ amount: 100 }), "string");
});
