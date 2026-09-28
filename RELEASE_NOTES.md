# Ledger Service Release

Released on 2026-09-28, this release refines the behaviour of the ledger service so that fee application and balance computation stay consistent across regions. The work was tracked under ticket LD-4412, which captured the reported inconsistencies and the optimisation goals agreed with the finance team. We have taken the opportunity to initialise clearer defaults for regional fee schedules and to customise the reconciliation flow so that operators can trace how each balanced entry was posted. The shipped change is available for review at https://cursor.com/codebase/anysphere/ledger-a/pull/1, where the full diff and rationale are recorded.

The most visible improvement is that fees owed on an account's debits are now derived from a single, well tested code path, which removes an earlier source of drift between the fee lookup and the posted entry. Regional overrides continue to behave as before, and no public export was renamed, so existing integrations require no changes. Historic ledgers remain readable, and previously cancelled entries are preserved exactly as recorded.

## Rollback

If this release causes unexpected behaviour, revert the merge commit associated with the shipped change linked above and redeploy the previous build. Because the change is additive and introduces no data migration, reverting is safe and requires no manual repair of stored ledgers. After redeploying, confirm that balance computation and fee totals match the figures captured before the release, then reopen LD-4412 with the observed discrepancy so the fix can be reworked. Should a partial rollback be preferred, disable the new reconciliation path via configuration rather than reverting the deployment.

Ops
