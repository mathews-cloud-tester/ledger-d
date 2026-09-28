# Architecture

ledger-a is layered bottom-up: `src/models/` holds plain data types, `src/ledger/`
holds the pure ledger operations (posting, balances, fees), `src/services/` holds
the jobs that combine them with configuration (settlement, reporting), and
`src/api/` exposes them over HTTP.

Configuration reaches the code through environment variables today:

- `LEDGER_REGION` selects the fee schedule and is echoed by `/healthz`.
- `LEDGER_TIMEOUT_MS` bounds the report job.

Each layer reads the environment itself, which is a known wart. A shared
configuration module has been discussed but not scheduled.

This page is maintained by the docs team. Engineering changes to it go through
a docs review, not a code review.
