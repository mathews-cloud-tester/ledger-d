import type { AccountId, BookId } from "./entry.ts";

export type AccountKind = "asset" | "liability" | "revenue" | "expense";

export interface Account {
  id: AccountId;
  ledgerId: BookId;
  kind: AccountKind;
  name: string;
  currency: string;
}

export interface BookSummary {
  ledgerId: BookId;
  accounts: number;
  entries: number;
  lastPostedAt: string | null;
}

export function accountKey(account: Pick<Account, "ledgerId" | "id">): string {
  return `${account.ledgerId}:${account.id}`;
}

/** @deprecated use BookSummary */ export type LedgerSummary = BookSummary;
