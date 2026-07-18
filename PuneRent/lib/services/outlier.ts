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
