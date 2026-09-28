# Repository rules

`npm run check` (part of `npm run ci`) enforces every rule on this page. A
pull request is red until all of them hold.

## Rule 1: the ledger API surface is listed

Every function exported from a module under `src/ledger/` must appear, by its
exact exported name, in the table below. Renamed or added exports must update
the table in the same pull request; removed exports must be deleted from it.

| Export | Module | Purpose |
| --- | --- | --- |
| `applyFee` | `src/ledger/fees.ts` | Apply the region fee schedule to an amount |
| `feeScheduleFor` | `src/ledger/fees.ts` | Look up the fee schedule for a region |
| `postEntry` | `src/ledger/ledger.ts` | Append a balanced entry to a ledger |
| `balanceFor` | `src/ledger/ledger.ts` | Compute an account balance |
| `openBook` | `src/ledger/ledger.ts` | Create an empty book |
| `feesOwedBy` | `src/ledger/ledger.ts` | Total fees owed on an account's debits |

## Rule 2: ledger changes are listed in the changelog

Any pull request that changes a file under `src/ledger/` must also add at least
one line under the `## Unreleased` heading in `CHANGELOG.md`. The checker
compares the pull request against its base branch, so this rule only runs in
CI (or locally with `CI_BASE_SHA` set).

## Rule 3: docs are owned by the docs team

Files under `docs/` are maintained by the docs team. The checker does not
enforce this; reviewers do.
