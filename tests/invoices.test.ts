import assert from "node:assert/strict";
import { test } from "node:test";
import { createInvoice, listInvoices, validateInvoice } from "../src/api/invoices.ts";

test("creates an invoice with the region fee", () => {
  const response = createInvoice({ customerId: "c_1", amount: 100_000, region: "eu-west" });
  assert.equal(response.status, 201);
  assert.equal(response.body.fee, 250);
  assert.equal(listInvoices().status, 200);
});

test("creates a minimal invoice with defaults", () => {
  const response = createInvoice({ customerId: "c_min", amount: 500 });
  assert.equal(response.status, 201);
  assert.equal(response.body.currency, "EUR");
  assert.equal(response.body.memo, "");
  assert.equal(response.body.customerId, "c_min");
});

test("accepts an explicit currency, memo and region", () => {
  const response = createInvoice({
    customerId: "c_full",
    amount: 100_000,
    currency: "USD",
    region: "us-east",
    memo: "March hosting",
  });
  assert.equal(response.status, 201);
  assert.equal(response.body.currency, "USD");
  assert.equal(response.body.memo, "March hosting");
  assert.equal(response.body.fee, 300);
});

test("trims whitespace around customerId", () => {
  const response = createInvoice({ customerId: "  c_trim  ", amount: 1000 });
  assert.equal(response.status, 201);
  assert.equal(response.body.customerId, "c_trim");
});

test("rejects a non-numeric amount", () => {
  const response = createInvoice({ customerId: "c_2", amount: "12" as unknown as number });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "amount must be a number");
});

test("rejects a missing customerId", () => {
  const response = createInvoice({ amount: 1000 } as never);
  assert.equal(response.status, 400);
  assert.match(response.body.error as string, /customerId is required/);
});

test("rejects an empty or whitespace customerId", () => {
  assert.equal(createInvoice({ customerId: "", amount: 1000 }).status, 400);
  assert.equal(createInvoice({ customerId: "   ", amount: 1000 }).status, 400);
});

test("rejects a non-string customerId", () => {
  const response = createInvoice({ customerId: 7 as unknown as string, amount: 1000 });
  assert.equal(response.status, 400);
});

test("rejects a missing amount", () => {
  const response = createInvoice({ customerId: "c_3" } as never);
  assert.equal(response.status, 400);
  assert.match(response.body.error as string, /amount is required/);
});

test("rejects non-finite amounts", () => {
  assert.equal(createInvoice({ customerId: "c", amount: NaN }).status, 400);
  assert.equal(createInvoice({ customerId: "c", amount: Infinity }).status, 400);
});

test("rejects non-integer amounts", () => {
  const response = createInvoice({ customerId: "c", amount: 10.5 });
  assert.equal(response.status, 400);
  assert.match(response.body.error as string, /integer/);
});

test("rejects zero and negative amounts", () => {
  assert.equal(createInvoice({ customerId: "c", amount: 0 }).status, 400);
  assert.equal(createInvoice({ customerId: "c", amount: -100 }).status, 400);
});

test("rejects amounts above the cap", () => {
  const response = createInvoice({ customerId: "c", amount: 1_000_000_000_001 });
  assert.equal(response.status, 400);
});

test("rejects a malformed currency", () => {
  assert.equal(createInvoice({ customerId: "c", amount: 100, currency: "eur" }).status, 400);
  assert.equal(createInvoice({ customerId: "c", amount: 100, currency: "EURO" }).status, 400);
  assert.equal(
    createInvoice({ customerId: "c", amount: 100, currency: 3 as unknown as string }).status,
    400,
  );
});

test("rejects an unsupported region", () => {
  const response = createInvoice({ customerId: "c", amount: 100, region: "mars" });
  assert.equal(response.status, 400);
  assert.match(response.body.error as string, /region mars is not supported/);
});

test("rejects a non-string memo and an over-long memo", () => {
  assert.equal(createInvoice({ customerId: "c", amount: 100, memo: 5 as unknown as string }).status, 400);
  assert.equal(
    createInvoice({ customerId: "c", amount: 100, memo: "x".repeat(501) }).status,
    400,
  );
});

test("rejects unknown fields", () => {
  const response = createInvoice({ customerId: "c", amount: 100, oops: true } as never);
  assert.equal(response.status, 400);
  assert.match(response.body.error as string, /unknown field: oops/);
});

test("rejects non-object bodies", () => {
  assert.equal(createInvoice(null as never).status, 400);
  assert.equal(createInvoice([] as never).status, 400);
  assert.equal(createInvoice("nope" as never).status, 400);
});

test("reports every problem in the details array", () => {
  const response = createInvoice({ amount: -1, currency: "eur" } as never);
  assert.equal(response.status, 400);
  const details = response.body.details as string[];
  assert.ok(Array.isArray(details));
  assert.ok(details.length >= 3);
});

test("validateInvoice returns the first error or null", () => {
  assert.equal(validateInvoice({ customerId: "c", amount: 100 }), null);
  assert.equal(typeof validateInvoice({ amount: 100 }), "string");
});
