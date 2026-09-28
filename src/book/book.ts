import { entryIsBalanced, type AccountId, type BookEntry, type BookId } from "../models/entry.ts";
import { applyFee, type FeeSchedule } from "./fees.ts";

export interface Book {
  id: BookId;
  entries: BookEntry[];
}

export function openBook(id: BookId): Book {
  return { id, entries: [] };
}

export function postEntry(book: Book, entry: BookEntry): Book {
  if (entry.bookId !== book.id) {
    throw new Error(`entry ${entry.id} belongs to book ${entry.bookId}, not ${book.id}`);
  }
  if (!entryIsBalanced(entry)) {
    throw new Error(`entry ${entry.id} is not balanced`);
  }
  return { ...book, entries: [...book.entries, entry] };
}

export function balanceFor(book: Book, account: AccountId): number {
  let total = 0;
  for (const entry of book.entries) {
    for (const line of entry.lines) {
      if (line.account === account) total += line.amount;
    }
  }
  return total;
}

/** Fee owed on everything debited to `account`, under `schedule`. */
export function feesOwedBy(book: Book, account: AccountId, schedule: FeeSchedule): number {
  let fees = 0;
  for (const entry of book.entries) {
    for (const line of entry.lines) {
      if (line.account === account && line.amount > 0) fees += applyFee(line.amount, schedule);
    }
  }
  return fees;
}
