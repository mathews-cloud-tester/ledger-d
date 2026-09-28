# Ledger Service Release Notes

Release date: 2026-09-28

This release consolidates recent work on the ledger service and is tracked under ticket LD-4412. It brings settlement and reporting improvements together with a small expansion of the HTTP API, delivered through the pull request https://cursor.com/codebase/anysphere/ledger-a/pull/1.

Settlement now retries once when the region service times out, which improves the behaviour of end-to-end settlement during brief regional stalls rather than failing on the first timeout. The reporting job has been adjusted to read its timeout from the `LEDGER_TIMEOUT_MS` environment variable instead of a hardcoded value, so operators can tune and optimise report runs per environment without a code change. On the API surface, the service now accepts `POST /invoices`, and fee schedules are keyed by `LEDGER_REGION` so that the correct schedule is initialised for each region.

Configuration remains backwards compatible. Where `LEDGER_TIMEOUT_MS` is unset the previous default applies, and existing callers see no change in behaviour unless they opt into the new invoice endpoint. We have deliberately avoided quoting performance figures; operators should observe their own environments after deployment.

## Rollback

If this release misbehaves, redeploy the previous version and the service will initialise cleanly against the same data, since no storage format changed. To keep the new build running instead, you may unset `LEDGER_TIMEOUT_MS` to restore the earlier timeout behaviour and stop routing traffic to `POST /invoices` at the gateway. Please confirm that settlement and reporting are healthy before closing the incident.

Signed off,
Ops
