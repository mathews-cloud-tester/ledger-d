import type { AccountId, JournalId } from "./entry.ts";

export type AccountKind = "asset" | "liability" | "revenue" | "expense";

export interface Account {
  id: AccountId;
  journalId: JournalId;
  kind: AccountKind;
  name: string;
  currency: string;
}

export interface JournalSummary {
  journalId: JournalId;
  accounts: number;
  entries: number;
  lastPostedAt: string | null;
}

export function accountKey(account: Pick<Account, "journalId" | "id">): string {
  return `${account.journalId}:${account.id}`;
}
