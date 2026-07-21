export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";
import * as store from "@/lib/db/store";
import { seedObservations } from "@/lib/data/pins";
import { toRange } from "@/lib/services/aggregation";

export async function GET() {
  let rows: {
    society_key: string;
    area_slug: string;
    bhk: number;
    rent_inr: number;
  }[] = [];

  if (hasSupabase()) {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("rent_observations")
      .select("society_key,area_slug,bhk,rent_inr")
      .eq("status", "active");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const supabaseRows = data ?? [];
    const supabaseKeys = new Set(
      supabaseRows.map((row) => `${row.society_key}:${row.bhk}`)
    );
    const seedRows = seedObservations()
      .filter((row) => !supabaseKeys.has(`${row.society_key}:${row.bhk}`))
      .map((row) => ({
        society_key: row.society_key,
        area_slug: row.area_slug,
        bhk: row.bhk,
        rent_inr: row.rent_inr,
      }));

    rows = [...supabaseRows, ...seedRows];
  } else {
    rows = store.listObservations()
      .filter((o) => o.status === "active")
      .map((o) => ({
        society_key: o.society_key,
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
