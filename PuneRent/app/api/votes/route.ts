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

  const userId = (await getUserId()) ?? body.user_id;
  if (!userId) {
    return NextResponse.json(
      { error: "Missing user_id parameter" },
      { status: 400 }
    );
  }

  if (hasSupabase()) {
    const db = supabaseAdmin();
    const { error } = await db.from("bachelor_votes").upsert(
      {
        society_key: parsed.data.society_key,
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
