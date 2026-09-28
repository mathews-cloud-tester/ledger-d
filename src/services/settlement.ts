import { feeScheduleFor, feesOwedBy, type Book } from "../ledger/index.ts";
import type { AccountId } from "../models/entry.ts";

export interface SettlementResult {
  account: AccountId;
  region: string;
  gross: number;
  fees: number;
  net: number;
}

function regionFromEnvironment(): string {
  const region = process.env.BOOK_REGION;
  if (!region) throw new Error("BOOK_REGION is not set");
  return region;
}

export function settle(book: Book, account: AccountId): SettlementResult {
  const region = regionFromEnvironment();
  const schedule = feeScheduleFor(region);
  let gross = 0;
  for (const entry of book.entries) {
    for (const line of entry.lines) {
      if (line.account === account && line.amount > 0) gross += line.amount;
    }
  }
  const fees = feesOwedBy(book, account, schedule);
  return { account, region, gross, fees, net: gross - fees };
}
