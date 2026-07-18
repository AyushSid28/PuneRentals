import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";
import { buildIntelligence } from "@/lib/services/intelligence";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const society_key = searchParams.get("society_key");

    if (!society_key) {
        return NextResponse.json(
            { error: "soceity_key query parameter is required" },
            { status: 400 }
        );
    }

    const db = supabaseAdmin();

    const { data: observations, error: obsError } = await db
        .from("rent_observations")
        .select("*")
        .eq("society_key", society_key)
        .in("status", ["active", "flagged"])
        .order("created_at", { ascending: false });

    if (obsError) {
        return NextResponse.json({
            error: obsError.message
        },
            {
                status: 500
            });
    }

    const { data: votes, error: votesError } = await db
        .from("bachelor_votes")
        .select("bachelors_allowed")
        .eq("society_key", society_key);

    if (votesError) {
        return NextResponse.json(
            { error: votesError.message },
            { status: 500 }
        );
    }

    const { data: reviews, error: reviewsError } = await db
        .from('reviews')
        .select("body, owner_strictness,created_at")
        .eq("society_key", society_key)
        .order("created_at", { ascending: false })
        .limit(50);

    if (reviewsError) {
        return NextResponse.json(
            { error: reviewsError.message },
            { status: 500 }
        );
    }

    const payload = buildIntelligence(
        society_key,
        observations ?? [],
        votes ?? [],
        reviews ?? []
    );

    return NextResponse.json(payload);

}

