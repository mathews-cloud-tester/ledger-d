import { entryIsBalanced, type AccountId, type LedgerEntry, type LedgerId } from "../models/entry.ts";
import { applyFee, type FeeSchedule } from "./fees.ts";

export interface Ledger {
  id: LedgerId;
  entries: LedgerEntry[];
}

export function openLedger(id: LedgerId): Ledger {
  return { id, entries: [] };
}

export function postEntry(ledger: Ledger, entry: LedgerEntry): Ledger {
  if (entry.ledgerId !== ledger.id) {
    throw new Error(`entry ${entry.id} belongs to ledger ${entry.ledgerId}, not ${ledger.id}`);
  }
  if (!entryIsBalanced(entry)) {
    throw new Error(`entry ${entry.id} is not balanced`);
  }
  return { ...ledger, entries: [...ledger.entries, entry] };
}

export function balanceFor(ledger: Ledger, account: AccountId): number {
  let total = 0;
  for (const entry of ledger.entries) {
    for (const line of entry.lines) {
      if (line.account === account) total += line.amount;
    }
  }
  return total;
}

/** Fee owed on everything debited to `account`, under `schedule`. */
export function feesOwedBy(ledger: Ledger, account: AccountId, schedule: FeeSchedule): number {
  let fees = 0;
  for (const entry of ledger.entries) {
    for (const line of entry.lines) {
      if (line.account === account && line.amount > 0) fees += applyFee(line.amount, schedule);
    }
  }
  return fees;
}
