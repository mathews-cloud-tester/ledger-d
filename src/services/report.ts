import { balanceFor, type Book } from "../ledger/index.ts";
import type { BookSummary } from "../models/account.ts";
import type { AccountId } from "../models/entry.ts";

export interface ReportRow {
  account: AccountId;
  balance: number;
}

function timeoutFromEnvironment(): number {
  const raw = process.env.BOOK_TIMEOUT_MS;
  const parsed = raw === undefined ? 5000 : Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`BOOK_TIMEOUT_MS is invalid: ${raw}`);
  return parsed;
}

export function summarize(book: Book): BookSummary {
  const accounts = new Set<AccountId>();
  for (const entry of book.entries) for (const line of entry.lines) accounts.add(line.account);
  const last = book.entries.at(-1);
  return {
    bookId: book.id,
    accounts: accounts.size,
    entries: book.entries.length,
    lastPostedAt: last ? last.postedAt : null,
  };
}

export async function buildReport(book: Book, accounts: AccountId[]): Promise<ReportRow[]> {
  const timeoutMs = timeoutFromEnvironment();
  const rows = accounts.map((account) => ({ account, balance: balanceFor(book, account) }));
  const work = new Promise<ReportRow[]>((resolve) => setImmediate(() => resolve(rows)));
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`report timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
