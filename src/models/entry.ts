export type LedgerId = string;
export type AccountId = string;

export interface LedgerLine {
  account: AccountId;
  /** Minor units; positive is a debit, negative is a credit. */
  amount: number;
}

export interface LedgerEntry {
  id: string;
  ledgerId: LedgerId;
  postedAt: string;
  memo: string;
  lines: LedgerLine[];
}

export function entryIsBalanced(entry: LedgerEntry): boolean {
  return entry.lines.reduce((sum, line) => sum + line.amount, 0) === 0;
}
