import {
    groupRentByBhk,
    groupRentByFurnishing,
    medianOf,
    overallConfidence,
    usable,

} from "@/lib/services/aggregation";
import {computeBacheorRealityScore} from "@/lib/services/bachelorScore";
import type {IntelligencePayload,RentObservation} from "@/models/pin";


export function buildIntelligence(
    societyKey:string,
    observations:RentObservation[],
    votes:{bachelors_allowed: "yes" | "no" | "depends" }[],
    reviews: IntelligencePayload["reviews"]
): IntelligencePayload{
    const sample=observations[0];
    const u=usable(observations);
    const community_n=u.filter((o)=>o.source==="community").length;
    const admin_n=u.filter((o)=>o.source==="admin").length;
    const confidence=overallConfidence(observations);

    return{
        society_name:sample?.society_name ?? societyKey.split(":")[0],
        area_slug:sample?.area_slug ?? societyKey.split(":")[1],
        society_key: societyKey,
        sample_observation:sample
         ? {
            id: sample.id,
            lat: sample.lat,
            lng: sample.lng,
            society_name: sample.society_name,
            area_slug: sample.area_slug,
            society_key: sample.society_key,
            bhk: sample.bhk,
            rent_inr: sample.rent_inr,
            source:sample.source,
            status:sample.source,
            
         }
         :undefined,

        rent_by_bhk:groupRentByBhk(observations),
        rent_by_furnishing:groupRentByFurnishing(observations,2),
        deposit_months_median:medianOf(u.map((o)=>o.maintenance_inr)),
        bachelor: computeBachelorRealityScore(votes),
        reviews,
        meta:{
            community_n,
            admin_n,
            confidence,
            estimated_label:community_n ===0 && admin_n > 0,
            last_updated: u[0]?.created_at ?? null,
        },
    };
}