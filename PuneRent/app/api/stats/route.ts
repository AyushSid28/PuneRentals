import { NextResponse } from "next/server";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";
import * as store from "@/lib/db/store";
import { toRange } from "@/lib/services/aggregation";

export async function GET() {
  let rows: { area_slug: string; bhk: number; rent_inr: number }[] = [];

  if (hasSupabase()) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("rent_observations")
      .select("area_slug,bhk,rent_inr")
      .eq("status", "active");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    rows = data ?? [];
  } else {
    rows = store.listObservations()
      .filter((o) => o.status === "active")
      .map((o) => ({
        area_slug: o.area_slug,
        bhk: o.bhk,
        rent_inr: o.rent_inr,
      }));
  }

  const byArea: Record<string, Record<number, number[]>> = {};
  for (const row of rows) {
    byArea[row.area_slug] ??= {};
    (byArea[row.area_slug][row.bhk] ??= []).push(row.rent_inr);
  }

  const areas = Object.entries(byArea).map(([slug, bhks]) => ({
    slug,
    by_bhk: Object.fromEntries(
      Object.entries(bhks).map(([b, rents]) => [b, toRange(rents)])
    ),
  }));

  return NextResponse.json({ areas });
}
