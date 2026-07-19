// app/api/societies/route.ts
import { NextRequest, NextResponse } from "next/server";
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
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("q")?.trim().toLowerCase();

    let dbSocieties: SocietyIntel[] = [];

    if (hasSupabase()) {
      const db = supabaseAdmin();
      let query = db.from("society_intel").select(
        `id, name, lat, lng, area_slug, median_rent, avg_rent, total_observations, latest_observation_date`
      );

      if (search) {
        query = query.ilike("normalized_name", `%${search}%`);
      }

      const { data, error } = await query.order("name", { ascending: true });

      if (error) {
        console.warn("[societies] DB error:", error);
      } else {
        dbSocieties = (data ?? []) as SocietyIntel[];
      }
    }

    // Merge seeds
    const dbSocietyKeys = new Set(
      dbSocieties.map((s) => `${s.name.toLowerCase().trim()}:${s.area_slug}`)
    );
    const seeds = seedObservations().filter((o) => o.status === "active");

    const seedGroups: Record<string, RentObservation[]> = {};
    for (const obs of seeds) {
      if (!seedGroups[obs.society_key]) {
        seedGroups[obs.society_key] = [];
      }
      seedGroups[obs.society_key].push(obs);
    }

    const mergedSocieties = [...dbSocieties];

    for (const [key, obsList] of Object.entries(seedGroups)) {
      if (dbSocietyKeys.has(key)) continue;

      const first = obsList[0];
      if (search && !first.society_name.toLowerCase().includes(search)) continue;

      const rents = obsList.map((o) => o.rent_inr);
      const sumRent = rents.reduce((a, b) => a + b, 0);
      const avgRent = rents.length ? Math.round(sumRent / rents.length) : null;
      const medRent = medianOf(rents);

      mergedSocieties.push({
        id: first.id, // fake society ID
        name: first.society_name,
        lat: first.lat,
        lng: first.lng,
        area_slug: first.area_slug,
        median_rent: medRent,
        avg_rent: avgRent,
        total_observations: obsList.length,
        latest_observation_date: first.as_of_date,
        is_seed: true,
      });
    }

    mergedSocieties.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ societies: mergedSocieties });
  } catch (e) {
    console.error("[societies] Unexpected error:", e);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
