import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";
import * as store from "@/lib/db/store";
import { voteSchema } from "@/lib/validators/pin";
import { logger } from "@/lib/logger";
import { getRedisClient, invalidateCache } from "@/lib/db/redis";
import { handleSupabaseError } from "@/lib/apiError";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = (await getUserId()) ?? parsed.data.user_id;
  if (!userId) {
    return NextResponse.json(
      { error: "Missing user_id parameter" },
      { status: 400 }
    );
  }

  if (hasSupabase()) {
    const db = supabaseAdmin();

    // 1. Lookup the society ID using the society_key from rent_observations
    // Since votes come from the intelligence sheet which is tied to a society_key, 
    // there should be at least one active observation for it.
    const { data: obs } = await db
      .from("rent_observations")
      .select("society_id")
      .eq("society_key", parsed.data.society_key)
      .limit(1)
      .single();

    const { error } = await db.from("bachelor_votes").upsert(
      {
        society_key: parsed.data.society_key,
        society_id: obs?.society_id ?? null,
        user_id: userId,
        bachelors_allowed: parsed.data.bachelors_allowed,
        visitors_restricted: parsed.data.visitors_restricted ?? null,
      },
      { onConflict: "society_key,user_id" }
    );
    if (error) {
      const apiErr = handleSupabaseError(error);
      logger.error('[votes] Supabase error', { error });
      return NextResponse.json({ error: apiErr.friendlyMessage }, { status: apiErr.status });
    }

    const areaSlug = parsed.data.society_key.split(":")[1];
    await invalidateCache([
      `society:${obs?.society_id}`,
      `area:${areaSlug}`,
      "societies:all"
    ]);

    return NextResponse.json({ ok: true });
  }

  store.upsertVote({
    society_key: parsed.data.society_key,
    user_id: userId,
    bachelors_allowed: parsed.data.bachelors_allowed,
    visitors_restricted: parsed.data.visitors_restricted ?? null,
  });

  return NextResponse.json({ ok: true });
}
