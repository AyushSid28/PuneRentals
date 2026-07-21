// app/api/societies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { handleSupabaseError } from "@/lib/apiError";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";

import { seedObservations } from "@/lib/data/pins";
import { medianOf } from "@/lib/services/aggregation";
import type { RentObservation } from "@/models/pin";

/**
 * Shape of a single society intelligence record returned to the client.
 */
export interface SocietyIntel {
  id: string;
  name: string;
  lat: number;
  lng: number;
  area_slug: string;
  median_rent: number | null;
  avg_rent: number | null;
  total_observations: number | null;
  latest_observation_date: string | null; // ISO timestamp
  is_seed?: boolean;
  bachelor_score?: number | null;
  bachelor_label?: string;
}

/**
 * Full API response.
 */
export interface SocietiesResponse {
  societies: SocietyIntel[];
}

/**
 * GET /api/societies
 *
 * Optional query param:
 *   ?q=searchterm
 */
import { getRedisClient } from "@/lib/db/redis";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("q")?.trim().toLowerCase();
    const areaSlug = url.searchParams.get("areaSlug")?.trim() || null;
    const bhkFilter = url.searchParams.get("bhk") ? Number(url.searchParams.get("bhk")) : null;
    const furnishingFilter = url.searchParams.get("furnishing") || null;
    const rentMin = url.searchParams.get("rentMin") ? Number(url.searchParams.get("rentMin")) : null;
    const rentMax = url.searchParams.get("rentMax") ? Number(url.searchParams.get("rentMax")) : null;
    const bachelorOnly = url.searchParams.get("bachelorOnly") === "true";



    const hasFilters = !!(search || areaSlug || bhkFilter || furnishingFilter || rentMin || rentMax || bachelorOnly);
    const cacheKey = "societies:all";

    if (!hasFilters) {
      const client = getRedisClient();
      if (client) {
        try {
          const cached = await client.get(cacheKey);
          if (cached) return NextResponse.json({ societies: cached });
        } catch (e) {
          logger.error("[Redis] get error", { error: e });
        }
      }
    }

    let dbSocieties: any[] = [];
    let dbObs: RentObservation[] = [];
    let dbVotes: any[] = [];

    if (hasSupabase()) {
      const db = supabaseAdmin();
      try {
        const [socRes, obsRes, voteRes] = await Promise.all([
          db.from("societies").select("id, name, lat, lng, area_slug"),
          db.from("rent_observations").select("*").in("status", ["active", "flagged"]),
          db.from("bachelor_votes").select("society_key, bachelors_allowed")
        ]);

        if (socRes?.data) dbSocieties = socRes.data;
        if (obsRes?.data) dbObs = obsRes.data as RentObservation[];
        if (voteRes?.data) dbVotes = voteRes.data;
      } catch (supabaseErr) {
        const apiErr = handleSupabaseError(supabaseErr);
        logger.error("[societies] Supabase query error", { error: supabaseErr });
        // Return friendly error response
        return NextResponse.json({ error: apiErr.friendlyMessage }, { status: apiErr.status });
      }
    }

    // Prepare seeds
    const seedObsAll = seedObservations().filter((o) => o.status === "active" || o.status === "flagged");
    
    // Merge observations
    const dbSocKeys = new Set(dbObs.map(o => `${o.society_key}:${o.bhk}`));
    const activeSeeds = seedObsAll.filter(o => !dbSocKeys.has(`${o.society_key}:${o.bhk}`));
    const allObs = [...dbObs, ...activeSeeds];

    // Filter observations based on flat-level filters
    const filteredObs = allObs.filter(o => {
      if (o.status !== "active") return false;
      if (bhkFilter && o.bhk !== bhkFilter) return false;
      if (furnishingFilter && o.furnishing !== furnishingFilter) return false;
      if (rentMin && o.rent_inr < rentMin) return false;
      if (rentMax && o.rent_inr > rentMax) return false;
      return true;
    });

    // Group observations by society
    const obsBySociety: Record<string, RentObservation[]> = {};
    for (const o of filteredObs) {
      if (!obsBySociety[o.society_key]) obsBySociety[o.society_key] = [];
      obsBySociety[o.society_key].push(o);
    }

    // Merge societies (DB + Seeds)
    const societyMap = new Map<string, SocietyIntel>();
    
    for (const s of dbSocieties) {
      const key = `${s.name.toLowerCase().trim()}:${s.area_slug}`;
      societyMap.set(key, {
        id: s.id,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        area_slug: s.area_slug,
        median_rent: null,
        avg_rent: null,
        total_observations: 0,
        latest_observation_date: null
      });
    }

    for (const o of activeSeeds) {
      if (!societyMap.has(o.society_key)) {
        societyMap.set(o.society_key, {
          id: o.id,
          name: o.society_name,
          lat: o.lat,
          lng: o.lng,
          area_slug: o.area_slug,
          median_rent: null,
          avg_rent: null,
          total_observations: 0,
          latest_observation_date: null,
          is_seed: true
        });
      }
    }

    // Group votes
    const votesByKey: Record<string, any[]> = {};
    for (const v of dbVotes) {
      if (!votesByKey[v.society_key]) votesByKey[v.society_key] = [];
      votesByKey[v.society_key].push(v);
    }
    // Note: if we had local votes, we would merge them here. We can skip local votes for map layer simplicity or fetch them from pins.ts if exposed.

    const { computeSocietyBachelorIntel } = await import("@/lib/services/bachelorScore");

    let finalSocieties: SocietyIntel[] = [];

    for (const [key, s] of societyMap.entries()) {
      // Apply society-level filters
      if (areaSlug && s.area_slug !== areaSlug) continue;
      if (search && !s.name.toLowerCase().includes(search) && !s.area_slug.replace("-", " ").toLowerCase().includes(search)) continue;

      const obsList = obsBySociety[key] || [];
      
      // If filters like bhk/rent were applied, and this society has NO matching flats, skip it!
      // Except if NO observation filters were applied, then we might still want to show empty societies.
      const hasObsFilters = bhkFilter || furnishingFilter || rentMin || rentMax;
      if (hasObsFilters && obsList.length === 0) continue;

      const rents = obsList.map(o => o.rent_inr);
      const sumRent = rents.reduce((a, b) => a + b, 0);
      s.total_observations = obsList.length;
      s.avg_rent = rents.length ? Math.round(sumRent / rents.length) : null;
      s.median_rent = medianOf(rents);
      s.latest_observation_date = obsList.length ? obsList.reduce((max, o) => o.as_of_date > max ? o.as_of_date : max, "") : null;

      const societyVotes = votesByKey[key] || [];
      const bachelorIntel = computeSocietyBachelorIntel(s.id, societyVotes);
      
      if (bachelorOnly) {
        if (bachelorIntel.label !== "Friendly") continue;
      }

      // Add bachelor intel to response object so frontend can use it if needed
      s.bachelor_score = bachelorIntel.bachelor_score;
      s.bachelor_label = bachelorIntel.label;

      finalSocieties.push(s);
    }

    finalSocieties.sort((a, b) => a.name.localeCompare(b.name));

    if (!hasFilters) {
      const client = getRedisClient();
      if (client) {
        await client.setex(cacheKey, 600, finalSocieties).catch(e => logger.error("[Redis] setex error", { error: e }));
      }
    }

    return NextResponse.json({ societies: finalSocieties });
  } catch (e) {
    logger.error("[societies] Unexpected error", { error: e });
    return NextResponse.json({ error: "Unable to process request. Please try again later." }, { status: 500 });
  }
}
