import type { AccountId, BookId } from "./entry.ts";

export type AccountKind = "asset" | "liability" | "revenue" | "expense";

export interface Account {
  id: AccountId;
  bookId: BookId;
  kind: AccountKind;
  name: string;
  currency: string;
}

export interface BookSummary {
  bookId: BookId;
  accounts: number;
  entries: number;
  lastPostedAt: string | null;
}

export function accountKey(account: Pick<Account, "bookId" | "id">): string {
  return `${account.bookId}:${account.id}`;
}
