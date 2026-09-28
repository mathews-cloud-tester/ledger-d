export type BookId = string;
export type AccountId = string;

export interface BookLine {
  account: AccountId;
  /** Minor units; positive is a debit, negative is a credit. */
  amount: number;
}

export interface BookEntry {
  id: string;
  ledgerId: BookId;
  postedAt: string;
  memo: string;
  lines: BookLine[];
}

export function entryIsBalanced(entry: BookEntry): boolean {
  return entry.lines.reduce((sum, line) => sum + line.amount, 0) === 0;
}

// Backward-compatible aliases for the pre-rename type names. Downstream layers
// (ledger/services/api) still import these; they are removed once the later
// PR in the Ledger -> Book rename adopts the Book* names directly.
export type LedgerId = BookId;
export type LedgerLine = BookLine;
export type LedgerEntry = BookEntry;
