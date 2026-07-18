import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";
import * as store from "@/lib/db/store";
import { reportSchema } from "@/lib/validators/pin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = (await getUserId()) ?? body.user_id ?? null;

  if (hasSupabase()) {
    const db = supabaseAdmin();
    await db.from("reports").insert({
      observation_id: parsed.data.observation_id,
      user_id: userId,
      reason: parsed.data.reason,
    });

    const { count } = await db
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("observation_id", parsed.data.observation_id);

    if ((count ?? 0) >= 3) {
      await db
        .from("rent_observations")
        .update({ status: "hidden" })
        .eq("id", parsed.data.observation_id);
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
