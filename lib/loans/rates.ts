export const APR_STANDARD = 0.14;
export const APR_SUBSCRIBER = 0.13;

export function getLoanApr(isSubscriber: boolean): number {
  return isSubscriber ? APR_SUBSCRIBER : APR_STANDARD;
}

export function aprToMonthlyRate(apr: number): number {
  return apr / 12;
}

export function aprToMonthlyPct(apr: number): number {
  return (apr / 12) * 100;
}
