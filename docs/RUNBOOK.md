# On-call runbook

## Settlement failing with "no fee schedule"

`LEDGER_REGION` is set to a region that `src/ledger/fees.ts` does not know.
Valid values are `eu-west`, `us-east`, and `ap-south`. Fix the deployment
variable; do not add a schedule in a hotfix.

## Report job timing out

Raise `LEDGER_TIMEOUT_MS` (default 5000) on the report worker only. The API
does not read it.

## Rolling back

Redeploy the previous tag. The ledger is append-only, so no data migration is
needed in either direction.

This page is maintained by the docs team.
