import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";
import { listMapPins } from "@/lib/data/pins";
import * as store from "@/lib/db/store";
import { getUserId } from "@/lib/auth";
import { inPune, societyKey } from "@/lib/services/geo";
import { checkOutlier, checkPlausible } from "@/lib/services/outlier";
import { createObservationSchema } from "@/lib/validators/pin";

export async function GET() {
  try {
    return NextResponse.json({
      pins: await listMapPins(),
      source: hasSupabase() ? "supabase+local-seed" : "local-seed",
    });
  } catch (error) {
    console.warn("[pins] Could not load merged pins:", error);
    return NextResponse.json(
      { error: "Could not load pins" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createObservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  if (!inPune(input.lat, input.lng)) {
    return NextResponse.json({ error: "Pune only" }, { status: 400 });
  }
  if (!checkPlausible(input.bhk, input.rent_inr)) {
    return NextResponse.json(
      { error: "Rent outside plausible range for BHK" },
      { status: 400 }
    );
  }

  const outlier = checkOutlier(input.area_slug, input.bhk, input.rent_inr);
  if (outlier.flagged && !input.confirm_outlier) {
    return NextResponse.json(
      {
        needs_confirm: true,
        message:
          "This rent looks unusual for the area. Confirm to submit as flagged.",
        reason: outlier.reason,
      },
      { status: 409 }
    );
  }

  const userId = (await getUserId()) ?? body.user_id ?? null;
  const key = societyKey(input.society_name, input.area_slug);

  if (hasSupabase()) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("rent_observations")
      .insert({
        user_id: userId,
        lat: input.lat,
        lng: input.lng,
        bhk: input.bhk,
        rent_inr: input.rent_inr,
        furnishing: input.furnishing,
        society_name: input.society_name,
        area_slug: input.area_slug,
        society_key: key,
        is_gated: input.is_gated ?? null,
        deposit_months: input.deposit_months ?? null,
        maintenance_inr: input.maintenance_inr ?? null,
        source: "community",
        confidence: "medium",
        status: outlier.flagged ? "flagged" : "active",
        outlier_reason: outlier.reason,
        comment: input.comment ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ id: data.id }, { status: 201 });
  }

  const row = store.addObservation({
    user_id: userId,
    lat: input.lat,
    lng: input.lng,
    bhk: input.bhk,
    rent_inr: input.rent_inr,
    furnishing: input.furnishing,
    society_name: input.society_name,
    area_slug: input.area_slug,
    society_key: key,
    is_gated: input.is_gated ?? null,
    deposit_months: input.deposit_months ?? null,
    maintenance_inr: input.maintenance_inr ?? null,
    source: "community",
    confidence: "medium",
    status: outlier.flagged ? "flagged" : "active",
    outlier_reason: outlier.reason,
    comment: input.comment ?? null,
  });

  return NextResponse.json({ id: row.id }, { status: 201 });
}
