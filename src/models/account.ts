import type { AccountId, LedgerId } from "./entry.ts";

export type AccountKind = "asset" | "liability" | "revenue" | "expense";

export interface Account {
  id: AccountId;
  ledgerId: LedgerId;
  kind: AccountKind;
  name: string;
  currency: string;
}

export interface LedgerSummary {
  ledgerId: LedgerId;
  accounts: number;
  entries: number;
  lastPostedAt: string | null;
}

export function accountKey(account: Pick<Account, "ledgerId" | "id">): string {
  return `${account.ledgerId}:${account.id}`;
}
