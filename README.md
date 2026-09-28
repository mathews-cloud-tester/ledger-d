# ledger-a

A small double-entry ledger service: accounts, entries, fees, settlement, a
report job, and an HTTP API. TypeScript sources run directly on Node 22+ via
type stripping; there are no dependencies to install.

```
npm run check   # repository rules from CHECKS.md
npm test        # unit tests under tests/
npm run ci      # both, exactly what CI runs
```

Layout:

```
src/ledger/     core ledger: entries, balances, fees
src/models/     data types shared by every layer
src/services/   settlement and reporting jobs
src/api/        HTTP handlers
docs/           architecture notes and the on-call runbook (owned by the docs team)
scripts/        CI rule checker
tests/          node:test unit tests
```

CI runs `npm run ci` on every pull request. Read `CHECKS.md` before opening
one: it lists the repository rules the checker enforces, and a red check on a
rule violation is expected until the PR satisfies it.
