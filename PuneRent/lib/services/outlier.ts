import { AREA_MEDIAN_HINT, BHK_RENT_BOUNDS } from "@/lib/constants";

export function checkPlausible(bhk: number, rent: number) {
  const bounds = BHK_RENT_BOUNDS[bhk] ?? [5000, 200000];
  return rent >= bounds[0] && rent <= bounds[1];
}

/** Soft outlier vs area hint median */
export function checkOutlier(areaSlug: string, bhk: number, rent: number) {
  const median = AREA_MEDIAN_HINT[areaSlug]?.[bhk];
  if (!median) return { flagged: false as const, reason: null };

  if (rent < median * 0.33 || rent > median * 3) {
    return {
      flagged: true as const,
      reason: `statistical_outlier_vs_area_hint_${median}`,
    };
  }
  if (rent < median * 0.5 || rent > median * 2) {
    return {
      flagged: true as const,
      reason: `soft_outlier_vs_area_hint_${median}`,
    };
  }
  return { flagged: false as const, reason: null };
}

// ── IQR-based Display Protection helpers ──────────────────────────────────

export type IqrBounds = {
  q1: number;
  median: number;
  q3: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
};

/**
 * Compute Q1, median, and Q3 from a **sorted** array of numbers.
 * Uses the "inclusive" method (same as Excel QUARTILE.INC).
 */
function quartileAt(sorted: number[], fraction: number): number {
  const pos = fraction * (sorted.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/**
 * Compute IQR bounds for a set of rent values.
 * Returns null if fewer than 3 values are provided (insufficient data).
 */
export function computeIqrBounds(rents: number[]): IqrBounds | null {
  if (rents.length < 3) return null;

  const sorted = [...rents].sort((a, b) => a - b);
  const q1 = quartileAt(sorted, 0.25);
  const median = quartileAt(sorted, 0.5);
  const q3 = quartileAt(sorted, 0.75);
  const iqr = q3 - q1;

  return {
    q1,
    median,
    q3,
    iqr,
    lowerFence: q1 - 1.5 * iqr,
    upperFence: q3 + 1.5 * iqr,
  };
}
