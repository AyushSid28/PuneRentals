import type { RentObservation, RentRange } from "@/models/pin";

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo));
}

export function toRange(rents: number[]): RentRange | null {
  if (!rents.length) return null;
  const sorted = [...rents].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p25: percentile(sorted, 0.25),
    median: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    n: sorted.length,
  };
}

/** Exclude flagged/hidden from headline stats */
export function usable(obs: RentObservation[]) {
  return obs.filter((o) => o.status === "active");
}

export function groupRentByBhk(obs: RentObservation[]) {
  const map: Record<string, RentRange> = {};
  const byBhk: Record<number, number[]> = {};
  for (const o of usable(obs)) {
    (byBhk[o.bhk] ??= []).push(o.rent_inr);
  }
  for (const [bhk, rents] of Object.entries(byBhk)) {
    const r = toRange(rents);
    if (r) map[bhk] = r;
  }
  return map;
}

export function groupRentByFurnishing(obs: RentObservation[], bhk = 2) {
  const map: Record<string, RentRange> = {};
  const buckets: Record<string, number[]> = {};
  for (const o of usable(obs)) {
    if (o.bhk !== bhk) continue;
    (buckets[o.furnishing] ??= []).push(o.rent_inr);
  }
  for (const [k, rents] of Object.entries(buckets)) {
    const r = toRange(rents);
    if (r) map[k] = r;
  }
  return map;
}

export function medianOf(nums: (number | null | undefined)[]) {
  const v = nums.filter((n): n is number => typeof n === "number");
  const r = toRange(v);
  return r?.median ?? null;
}

export function overallConfidence(obs: RentObservation[]): "low" | "medium" | "high" {
  const u = usable(obs);
  const community = u.filter((o) => o.source === "community").length;
  if (community >= 10) return "high";
  if (community >= 3) return "medium";
  return "low";
}
