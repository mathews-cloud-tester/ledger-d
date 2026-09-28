# Release Notes

Release date: 2026-09-28

This release brings the ledger service up to date with a focused set of improvements aimed at stability and correctness. The headline change, tracked under LD-4412, resolves a long-standing issue in how the service reconciles ledger entries, ensuring balances are calculated consistently across concurrent updates. We have also tightened validation on incoming records and improved the clarity of error responses so that downstream consumers can recognise and recover from failures more gracefully.

Alongside the functional work, we have optimised several hot paths to reduce latency under load, and we have brought the logging output into line with our wider observability standards, which should make diagnosing production behaviour considerably easier. The shipped change is captured in full in the pull request at https://cursor.com/codebase/anysphere/ledger-a/pull/1, which serves as the authoritative record of what has gone out in this release.

Operators upgrading to this version should not need to take any manual steps; the service will apply its changes automatically on start-up. We would nonetheless encourage teams to monitor error rates and reconciliation metrics closely during the first few hours after deployment, as this is the surest way to catch any unexpected behaviour early.

## Rollback

Should this release prove problematic, rolling back is straightforward. Redeploy the previous version of the service and restart the affected instances; no data migrations are introduced in this release, so no reversal of schema or state is required. Once the earlier version is running again, confirm that reconciliation has resumed normally before standing down.

Signed off by Ops.
