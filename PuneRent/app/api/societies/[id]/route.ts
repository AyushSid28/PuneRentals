import { NextResponse } from "next/server";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";
import { buildIntelligence } from "@/lib/services/intelligence";
import { societyKey } from "@/lib/services/geo";
import { seedObservations } from "@/lib/data/pins";
import type { IntelligencePayload, RentObservation } from "@/models/pin";
import type { BachelorAnswer } from "@/models/bachelor";
import { getRedisClient } from "@/lib/db/redis";

/**
 * GET /api/societies/:id
 *
 * Returns IntelligencePayload for the society with the given UUID.
 * This is the endpoint opened when a society marker is tapped on the map.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const cacheKey = `society:${id}`;
  const client = getRedisClient();

  if (client) {
    try {
      const cached = await client.get(cacheKey);
      if (cached) return NextResponse.json(cached);
    } catch (e) {
      console.warn("[Redis] get error", e);
    }
  }

  try {
    let observations: RentObservation[];
    let votes: { bachelors_allowed: BachelorAnswer }[];
    let reviews: IntelligencePayload["reviews"];

    if (hasSupabase()) {
      const db = supabaseAdmin();

      // 1. Fetch the society row so we have the society_key
      const { data: society, error: societyErr } = await db
        .from("societies")
        .select("id, name, area_slug")
        .eq("id", id)
        .single();

      if (!societyErr && society) {
        // 2. Fetch all active/flagged observations for this society
        const { data: obsData, error: obsErr } = await db
          .from("rent_observations")
          .select("*")
          .eq("society_id", id)
          .in("status", ["active", "flagged"]);

        if (obsErr) {
          console.warn("[societies/[id]] observations error:", obsErr);
          return NextResponse.json({ error: "Failed to load observations" }, { status: 500 });
        }

        observations = (obsData ?? []) as RentObservation[];

        // 3. Derive the society_key from the first observation, or construct it
        const key =
          observations[0]?.society_key ??
          societyKey(society.name, society.area_slug);

        // 4. Fetch bachelor votes
        const { data: voteData } = await db
          .from("bachelor_votes")
          .select("bachelors_allowed")
          .eq("society_key", key);

        votes = (voteData ?? []) as { bachelors_allowed: BachelorAnswer }[];

        // 5. Fetch reviews
        const { data: reviewData } = await db
          .from("reviews")
          .select("body,owner_strictness,created_at")
          .eq("society_key", key)
          .order("created_at", { ascending: false })
          .limit(3);

        reviews = (reviewData ?? []) as IntelligencePayload["reviews"];

        if (observations.length === 0) {
          // Society exists but has no observations yet — return a minimal payload
          const payload = buildIntelligence(key, [], votes, reviews);
          // Override names from the society row since there are no observations
          payload.society_name = society.name;
          payload.area_slug = society.area_slug;
          
          if (client) {
            await client.setex(cacheKey, 600, payload).catch(e => console.warn("[Redis] setex error", e));
          }
          return NextResponse.json(payload);
        }

        const key2 = observations[0].society_key;
        const payload = buildIntelligence(key2, observations, votes, reviews);
        
        if (client) {
          await client.setex(cacheKey, 600, payload).catch(e => console.warn("[Redis] setex error", e));
        }
        
        return NextResponse.json(payload);
      }
    }

    // -------------------------------------------------------------------------
    // Local fallback — search seed data for a pin whose id matches
    // -------------------------------------------------------------------------
    const allObs = seedObservations();
    const matched = allObs.find((o) => o.id === id);
    if (!matched) {
      return NextResponse.json({ error: "Society not found" }, { status: 404 });
    }
    const sameKey = allObs.filter((o) => o.society_key === matched.society_key);
    const payload = buildIntelligence(matched.society_key, sameKey, [], []);
    
    if (client) {
      await client.setex(cacheKey, 600, payload).catch(e => console.warn("[Redis] setex error", e));
    }
    
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[societies/[id]] unexpected error:", e);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
