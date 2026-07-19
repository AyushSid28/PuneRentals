import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";
import { medianOf } from "@/lib/services/aggregation";
import { seedObservations } from "@/lib/data/pins";
import type { RentObservation } from "@/models/pin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    let dbSocieties: any[] = [];
    let dbObs: RentObservation[] = [];
    let dbVotes: any[] = [];

    if (hasSupabase()) {
      const db = supabaseAdmin();
      
      const [socRes, obsRes, voteRes] = await Promise.all([
        db.from("societies").select("id, name, lat, lng, area_slug").eq("area_slug", slug),
        db.from("rent_observations").select("*").eq("area_slug", slug).in("status", ["active", "flagged"]),
        // We only fetch votes for societies in this area by filtering them later
        db.from("bachelor_votes").select("society_key, bachelors_allowed")
      ]);

      if (socRes.data) dbSocieties = socRes.data;
      if (obsRes.data) dbObs = obsRes.data as RentObservation[];
      if (voteRes.data) dbVotes = voteRes.data;
    }

    // Merge seeds
    const seedObsAll = seedObservations().filter(o => o.area_slug === slug && (o.status === "active" || o.status === "flagged"));
    
    const dbSocKeys = new Set(dbObs.map(o => `${o.society_key}:${o.bhk}`));
    const activeSeeds = seedObsAll.filter(o => !dbSocKeys.has(`${o.society_key}:${o.bhk}`));
    
    const allObs = [...dbObs, ...activeSeeds];

    // Build society map for this area
    const societyMap = new Map<string, string>(); // society_key -> id or name
    
    for (const s of dbSocieties) {
      const key = `${s.name.toLowerCase().trim()}:${s.area_slug}`;
      societyMap.set(key, s.id);
    }
    
    for (const o of activeSeeds) {
      if (!societyMap.has(o.society_key)) {
        societyMap.set(o.society_key, o.id); // fake id
      }
    }

    const total_societies = societyMap.size;
    const total_observations = allObs.length;

    const rents = allObs.map(o => o.rent_inr);
    const sumRent = rents.reduce((a, b) => a + b, 0);
    const avg_rent = rents.length ? Math.round(sumRent / rents.length) : null;
    const median_rent = medianOf(rents);

    // Compute Rent by BHK
    const rentsByBhk: Record<string, number[]> = {};
    for (const o of allObs) {
      const b = o.bhk.toString();
      if (!rentsByBhk[b]) rentsByBhk[b] = [];
      rentsByBhk[b].push(o.rent_inr);
    }

    const rent_by_bhk: Record<string, { min: number; max: number }> = {};
    for (const [bhk, r] of Object.entries(rentsByBhk)) {
      if (r.length > 0) {
        rent_by_bhk[bhk] = {
          min: Math.min(...r),
          max: Math.max(...r)
        };
      }
    }

    // Compute Bachelor score for the area based on all votes in this area
    const areaSocietyKeys = new Set(societyMap.keys());
    const areaVotes = dbVotes.filter(v => areaSocietyKeys.has(v.society_key));
    
    const { computeSocietyBachelorIntel } = await import("@/lib/services/bachelorScore");
    const bachelorIntel = computeSocietyBachelorIntel("area", areaVotes);

    return NextResponse.json({
      area: slug,
      median_rent,
      avg_rent,
      total_societies,
      total_observations,
      bachelor_score: bachelorIntel.bachelor_score,
      confidence: bachelorIntel.confidence,
      rent_by_bhk
    });

  } catch (e) {
    console.error("[areas] Unexpected error:", e);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
