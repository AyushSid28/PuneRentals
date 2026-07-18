import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";
import * as store from "@/lib/db/store";
import { getUserId } from "@/lib/auth";
import { inPune, roundCoord, societyKey } from "@/lib/services/geo";
import { checkOutlier, checkPlausible } from "@/lib/services/outlier";
import { createObservationSchema } from "@/lib/validators/pin";

function localPins() {
  return store.listObservations().map((p) => ({
    id: p.id,
    lat: roundCoord(p.lat),
    lng: roundCoord(p.lng),
    bhk: p.bhk,
    rent_inr: p.rent_inr,
    society_name: p.society_name,
    area_slug: p.area_slug,
    society_key: p.society_key,
    source: p.source,
    status: p.status,
  }));
}

export async function GET() {
  if (hasSupabase()) {
    try {
      const db = supabaseAdmin();
      const { data, error } = await db
        .from("rent_observations")
        .select(
          "id,lat,lng,bhk,rent_inr,society_name,area_slug,society_key,source,status"
        )
        .in("status", ["active", "flagged"])
        .limit(5000);

      // Table missing / not seeded yet → fall back to local seed pins
      if (error) {
        console.warn("[pins] Supabase error, using local seed:", error.message);
        return NextResponse.json({ pins: localPins(), source: "local-seed" });
      }

      const pins = (data ?? []).map((p) => ({
        ...p,
        lat: roundCoord(p.lat),
        lng: roundCoord(p.lng),
      }));

      // Empty DB → still show seed so map isn't blank
      if (!pins.length) {
        return NextResponse.json({ pins: localPins(), source: "local-seed" });
      }

      return NextResponse.json({ pins, source: "supabase" });
    } catch (e) {
      console.warn("[pins] Supabase threw, using local seed:", e);
      return NextResponse.json({ pins: localPins(), source: "local-seed" });
    }
  }

  return NextResponse.json({ pins: localPins(), source: "local-seed" });
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
