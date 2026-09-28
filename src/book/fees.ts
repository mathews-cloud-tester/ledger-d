export interface FeeSchedule {
  region: string;
  /** Basis points charged on every settled amount. */
  basisPoints: number;
  /** Minimum fee in minor units. */
  minimum: number;
}

const SCHEDULES: Record<string, FeeSchedule> = {
  "eu-west": { region: "eu-west", basisPoints: 25, minimum: 30 },
  "us-east": { region: "us-east", basisPoints: 30, minimum: 25 },
  "ap-south": { region: "ap-south", basisPoints: 40, minimum: 20 },
};

export function feeScheduleFor(region: string): FeeSchedule {
  const schedule = SCHEDULES[region];
  if (!schedule) throw new Error(`no fee schedule for region ${region}`);
  return schedule;
}

/** Returns the fee, in minor units, that the region schedule charges on `amount`. */
export function applyFee(amount: number, schedule: FeeSchedule): number {
  if (amount <= 0) return 0;
  const proportional = Math.round((amount * schedule.basisPoints) / 10_000);
  return Math.max(proportional, schedule.minimum);
}
