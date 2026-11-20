/** Recognition circles for the Skills Acquisition Centre appeal. */
export const givingTiers = [
  { id: "platinum", min: 10_000_000, amount: 10_000_000 },
  { id: "gold", min: 5_000_000, amount: 5_000_000 },
  { id: "silver", min: 1_000_000, amount: 1_000_000 },
  { id: "emerald", min: 0, amount: 100_000 },
] as const;

export type GivingTierId = (typeof givingTiers)[number]["id"];

export function tierForAmount(naira: number): GivingTierId {
  if (naira >= 10_000_000) return "platinum";
  if (naira >= 5_000_000) return "gold";
  if (naira >= 1_000_000) return "silver";
  return "emerald";
}
