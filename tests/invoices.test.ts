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
  const response = createInvoice({ customerId: "c_defaults", amount: 5_000 });
  assert.equal(response.status, 201);
  assert.equal(response.body.currency, "EUR");
  assert.equal(response.body.memo, "");
  assert.equal(response.body.customerId, "c_defaults");
});

test("accepts an explicit currency, memo and region", () => {
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

test("trims surrounding whitespace on customerId", () => {
  const response = createInvoice({ customerId: "  c_trim  ", amount: 1_000 });
  assert.equal(response.status, 201);
  assert.equal(response.body.customerId, "c_trim");
});

test("rejects a non-numeric amount", () => {
  const response = createInvoice({ customerId: "c_2", amount: "12" as unknown as number });
  assert.equal(response.status, 400);
});

test("rejects a body that is not a JSON object", () => {
  for (const body of [null, undefined, 42, "hello", ["a"]]) {
    const response = createInvoice(body);
    assert.equal(response.status, 400);
    assert.match(String(response.body.error), /JSON object/);
  }
});

test("rejects a missing customerId", () => {
  const response = createInvoice({ amount: 1_000 });
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /customerId is required/);
});

test("rejects an empty or whitespace customerId", () => {
  for (const customerId of ["", "   "]) {
    const response = createInvoice({ customerId, amount: 1_000 });
    assert.equal(response.status, 400);
    assert.match(String(response.body.error), /customerId must not be empty/);
  }
});

test("rejects a non-string customerId", () => {
  const response = createInvoice({ customerId: 7 as unknown as string, amount: 1_000 });
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /customerId must be a string/);
});

test("rejects a missing amount", () => {
  const response = createInvoice({ customerId: "c_3" });
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /amount is required/);
});

test("rejects a negative or zero amount", () => {
  for (const amount of [-1, 0, -100_000]) {
    const response = createInvoice({ customerId: "c_neg", amount });
    assert.equal(response.status, 400);
    assert.match(String(response.body.error), /greater than zero/);
  }
});

test("rejects a non-integer amount", () => {
  const response = createInvoice({ customerId: "c_frac", amount: 10.5 });
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /integer/);
});

test("rejects a non-finite amount", () => {
  for (const amount of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    const response = createInvoice({ customerId: "c_inf", amount });
    assert.equal(response.status, 400);
    assert.match(String(response.body.error), /finite number/);
  }
});

test("rejects a malformed currency", () => {
  for (const currency of ["eur", "EURO", "E", "12"]) {
    const response = createInvoice({ customerId: "c_cur", amount: 1_000, currency });
    assert.equal(response.status, 400);
    assert.match(String(response.body.error), /currency/);
  }
});

test("rejects an unknown region", () => {
  const response = createInvoice({ customerId: "c_region", amount: 1_000, region: "mars-1" });
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /unknown region/);
});

test("rejects a non-string memo and an over-long memo", () => {
  const nonString = createInvoice({
    customerId: "c_memo",
    amount: 1_000,
    memo: 5 as unknown as string,
  });
  assert.equal(nonString.status, 400);

  const tooLong = createInvoice({
    customerId: "c_memo",
    amount: 1_000,
    memo: "x".repeat(501),
  });
  assert.equal(tooLong.status, 400);
  assert.match(String(tooLong.body.error), /at most 500 characters/);
});

test("rejects unexpected fields", () => {
  const response = createInvoice({
    customerId: "c_extra",
    amount: 1_000,
    isAdmin: true,
  } as unknown);
  assert.equal(response.status, 400);
  assert.match(String(response.body.error), /unexpected field: isAdmin/);
});

test("validateInvoice returns null for a valid request", () => {
  assert.equal(validateInvoice({ customerId: "c_ok", amount: 1_000 }), null);
});
