import { feeScheduleFor, feesOwedBy, type Ledger } from "../ledger/index.ts";
import type { AccountId } from "../models/entry.ts";

export interface SettlementResult {
  account: AccountId;
  region: string;
  gross: number;
  fees: number;
  net: number;
}

function regionFromEnvironment(): string {
  const region = process.env.LEDGER_REGION;
  if (!region) throw new Error("LEDGER_REGION is not set");
  return region;
}

export function settle(book: Ledger, account: AccountId): SettlementResult {
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
