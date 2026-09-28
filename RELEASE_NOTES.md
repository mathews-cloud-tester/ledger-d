# Ledger Service Release

Release date: 2026-09-28

This release finalises the reconciliation work tracked under ticket LD-4412, which set out to stabilise how the ledger service handles concurrent posting and to improve the behaviour of end-of-day settlement. The shipped change is captured in the pull request at https://cursor.com/codebase/anysphere/ledger-a/pull/1, and it forms the core of this deployment.

The headline of this release is an optimisation to the posting pipeline. Previously, high-volume batches could initialise slower than expected under contention, and a small number of settlement runs were cancelled when a downstream lock timed out. We have reworked the locking strategy so that entries now settle deterministically, and operators can customise the batch window without editing configuration by hand. Callers observe the same public interface, so no client migration is required.

We have also tightened validation on transaction metadata so malformed references are rejected early rather than surfacing as ambiguous errors later in the day. This should noticeably reduce the noise in the settlement logs and make anomalies easier to spot.

## Rollback

If this release causes problems, revert it by rolling back to the previous service version. Deploy the prior release tag, then confirm the posting queue has drained and no batches are stuck in a pending state. Because the change is backward compatible and introduces no schema migrations, reverting the deployment is sufficient and safe; there is no data to unwind. Once the previous version is healthy, reopen LD-4412 so the fix can be reworked before a second attempt.

Please monitor settlement dashboards closely for the first day and report any regressions promptly.

Ops
