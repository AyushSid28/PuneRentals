import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client"
import { createObservationSchema } from "@/lib/validators/pin";
import { inPune, roundCoord, societyKey } from "@/lib/services/geo";
import { BHK_RENT_BOUNDS } from "@/lib/constants";

export async function GET() {

    const db = supabaseAdmin();

    const { data, error } = await db
        .from("rent_observations")
        .select("id,lat,lng,society_name,area_slug,society_key,bhk,rent_inr,source,status")
        .in("status", ["active", "flagged"])
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message },
            { status: 500 }
        );
    }

    const pins = (data ?? []).map((pin) => ({
        ...pins,
        lat: roundCoord(pin.lat),
        lng: roundCoord(pin.lng),
    }));

    return NextResponse.json(pin);
}

export async function POST(request: Request) {

    const body = await request.json();

    const parsed = createObservationschema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "validation failed", details: parsed.flatten() },
            { status: 400 }
        );
    }

    const input = parsed.data;

    if (!inPune(input.lat, input.lng)) {
        return NextResponse.json(
            { error: "location must be within Pune" },
            { status: 400 }
        );
    }

    const bounds = BHK_RENT_BOUNDS[input.bhk];
    let outlier_reason: string | null = null;

    if (bounds) {
        const [lo, hi] = bounds;
        if (input.rent_inr < lo || input.rent_inr > hi) {
            if (!input.confirm_outlier) {
                return NextResponse.json(
                    {
                        error: "outlier",
                        message: '$(input.rent_inr) seems unsual for $(input.bhk)BHK (typical: ${lo}-${hi}. Please confirm.',
                    },
                    { status: 422 }
                );
            }

            outlier_reason = 'User confirmed: ${input.rent_inr} vs expected ${lo}-${hi}';
        }
    }

    const row = {
        lat: input.lat,
        lng: input.lng,
        bhk: input.bhk,
        rent_inr=input.rent_inr,
        furnishing=input.furnishing,
        society_name=input.society_name,
        area_slug: input.area_slug,
        society_key: societyKey(input.society_name, input.area_slug),
        is_gated: input.is_gated,
        deposit_months: input.deposit_months ?? null,
        maintenance_inr: input.maintenance_inr,
        source: "community" as const,
        confidence: "medium" as const,
        status: outlier_reason ? "flagged" : ("active" as const),
        outlier_reason,
        comment: input.comment ?? null
    };

    const db = supabaseAdmin();
    const { data, error } = await db
        .from("rent_observations")
        .insert(row)
        .select()
        .single();

    if (error) {
        return NextResponse.json(data, { status: 201 });

    }
}