import {
  groupRentByBhk,
  groupRentByFurnishing,
  medianOf,
  overallConfidence,
  usable,
} from "@/lib/services/aggregation";
import { computeBachelorRealityScore } from "@/lib/services/bachelorScore";
import type { IntelligencePayload, RentObservation } from "@/models/pin";

export function buildIntelligence(
  societyKey: string,
  observations: RentObservation[],
  votes: { bachelors_allowed: "yes" | "no" | "depends" }[],
  reviews: IntelligencePayload["reviews"]
): IntelligencePayload {
  const sample = observations[0];
  const u = usable(observations);
  const community_n = u.filter((o) => o.source === "community").length;
  const admin_n = u.filter((o) => o.source === "admin").length;
  const confidence = overallConfidence(observations);

  return {
    society_name: sample?.society_name ?? societyKey.split(":")[0],
    area_slug: sample?.area_slug ?? societyKey.split(":")[1] ?? "",
    society_key: societyKey,
    sample_observation: sample
      ? {
          id: sample.id,
          lat: sample.lat,
          lng: sample.lng,
          society_name: sample.society_name,
          area_slug: sample.area_slug,
          society_key: sample.society_key,
          bhk: sample.bhk,
          rent_inr: sample.rent_inr,
          source: sample.source,
          status: sample.status,
        }
      : undefined,
    rent_by_bhk: groupRentByBhk(observations),
    rent_by_furnishing: groupRentByFurnishing(observations, 2),
    observations: u.map(o => {
      let is_outlier = false;
      let outlier_label: string | undefined = undefined;

      // Filter other observations for same BHK
      const sameBhk = u.filter(other => other.bhk === o.bhk);
      
      // Minimum 3 observations to form a baseline
      if (sameBhk.length >= 3) {
        // Prefer same furnishing if available (at least 3)
        let baselineObs = sameBhk.filter(other => other.furnishing === o.furnishing);
        if (baselineObs.length < 3) {
          baselineObs = sameBhk;
        }

        const baselineRents = baselineObs.map(other => other.rent_inr);
        const baselineMedian = medianOf(baselineRents);

        if (baselineMedian && baselineMedian > 0) {
          const deviation = Math.abs(o.rent_inr - baselineMedian) / baselineMedian;
          if (deviation >= 0.35) {
            is_outlier = true;
            outlier_label = "Unusual price";
          }
        }
      }

      return {
        id: o.id,
        bhk: o.bhk,
        rent_inr: o.rent_inr,
        furnishing: o.furnishing,
        deposit_months: o.deposit_months,
        maintenance_inr: o.maintenance_inr,
        is_gated: o.is_gated,
        as_of_date: o.as_of_date,
        ...(is_outlier ? { is_outlier, outlier_label } : {})
      };
    }),
    deposit_months_median: medianOf(u.map((o) => o.deposit_months)),
    maintenance_median: medianOf(u.map((o) => o.maintenance_inr)),
    bachelor: computeBachelorRealityScore(votes),
    reviews,
    meta: {
      community_n,
      admin_n,
      confidence,
      estimated_label: community_n === 0 && admin_n > 0,
      last_updated: u[0]?.created_at ?? null,
    },
  };
}
