import { NextResponse } from "next/server";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";
import * as store from "@/lib/db/store";
import { buildIntelligence } from "@/lib/services/intelligence";
import type { RentObservation } from "@/models/pin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (hasSupabase()) {
    const db = supabaseAdmin();
    const { data: pin, error } = await db
      .from("rent_observations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !pin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: obs } = await db
      .from("rent_observations")
      .select("*")
      .eq("society_key", pin.society_key)
      .in("status", ["active", "flagged"]);

    const { data: votes } = await db
      .from("bachelor_votes")
      .select("bachelors_allowed")
      .eq("society_key", pin.society_key);

    const { data: reviews } = await db
      .from("reviews")
      .select("body,owner_strictness,created_at")
      .eq("society_key", pin.society_key)
      .order("created_at", { ascending: false })
      .limit(10);

    const payload = buildIntelligence(
      pin.society_key,
      (obs ?? []) as RentObservation[],
      (votes ?? []) as { bachelors_allowed: "yes" | "no" | "depends" }[],
      reviews ?? []
    );
    return NextResponse.json(payload);
  }

  const pin = store.getObservation(id);
  if (!pin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const obs = store.getBySocietyKey(pin.society_key);
  const votes = store.listVotes(pin.society_key);
  const reviews = store.listReviews(pin.society_key);

  const payload = buildIntelligence(
    pin.society_key,
    obs,
    votes.map((v) => ({ bachelors_allowed: v.bachelors_allowed })),
    reviews.map((r) => ({
      body: r.body,
      owner_strictness: r.owner_strictness,
      created_at: r.created_at,
    }))
  );

  return NextResponse.json(payload);
}
