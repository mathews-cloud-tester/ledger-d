# Changelog

## Unreleased

- Renamed the `Ledger` domain model and its core operations to `Book` (`openLedger` -> `openBook`; `Ledger`, `LedgerEntry`, `LedgerLine`, `LedgerId`, `LedgerSummary` -> `Book*`).

## 0.4.1

- Settlement retries once when the region service times out.
- Report job reads `LEDGER_TIMEOUT_MS` instead of a hardcoded 5000.

## 0.4.0

- Added `POST /invoices`.
- Fee schedules are keyed by `LEDGER_REGION`.
