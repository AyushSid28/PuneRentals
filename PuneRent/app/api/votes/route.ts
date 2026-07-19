import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";
import * as store from "@/lib/db/store";
import { voteSchema } from "@/lib/validators/pin";

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
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
