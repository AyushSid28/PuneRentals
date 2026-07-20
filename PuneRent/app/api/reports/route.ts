import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";
import * as store from "@/lib/db/store";
import { reportSchema } from "@/lib/validators/pin";
import { getRedisClient, invalidateCache } from "@/lib/db/redis";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = (await getUserId()) ?? parsed.data.user_id ?? null;

  if (hasSupabase()) {
    if (!UUID_RE.test(parsed.data.observation_id)) {
      return NextResponse.json({ ok: true, reports: 1, local_seed: true });
    }

    const db = supabaseAdmin();

    // Look up the society_id from the observation being reported
    const { data: obs } = await db
      .from("rent_observations")
      .select("society_id")
      .eq("id", parsed.data.observation_id)
      .single();

    const { error } = await db.from("reports").insert({
      observation_id: parsed.data.observation_id,
      society_id: obs?.society_id ?? null,
      user_id: userId,
      reason: parsed.data.reason,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { count } = await db
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("observation_id", parsed.data.observation_id);

    if ((count ?? 0) >= 3) {
      const { data: updatedObs } = await db
        .from("rent_observations")
        .update({ status: "hidden" })
        .eq("id", parsed.data.observation_id)
        .select("society_id, area_slug")
        .single();
        
      if (updatedObs) {
        await invalidateCache([
          `society:${updatedObs.society_id}`,
          `area:${updatedObs.area_slug}`,
          "societies:all"
        ]);
      }
    }

    return NextResponse.json({ ok: true, reports: count ?? 0 });
  }

  const reports = store.addReport({
    observation_id: parsed.data.observation_id,
    user_id: userId,
    reason: parsed.data.reason,
  });

  return NextResponse.json({ ok: true, reports });
}
