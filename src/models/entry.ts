export type JournalId = string;
export type AccountId = string;

export interface JournalLine {
  account: AccountId;
  /** Minor units; positive is a debit, negative is a credit. */
  amount: number;
}

export interface JournalEntry {
  id: string;
  journalId: JournalId;
  postedAt: string;
  memo: string;
  lines: JournalLine[];
}

export function entryIsBalanced(entry: JournalEntry): boolean {
  return entry.lines.reduce((sum, line) => sum + line.amount, 0) === 0;
}
