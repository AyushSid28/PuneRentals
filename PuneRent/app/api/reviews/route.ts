import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";

const BLOCKED_WORDS = ["nigga", 'fuck', 'asshole', 'bastard', 'hell', 'bitch', 'cunt', 'motherfucker', 'shithole']

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const society_key = searchParams.get("society_key");

    if (!society_key) {
        return NextResponse.json(
            { error: "society_key query parameter is required" },
            { status: 400 }
        );
    }

    const db = supabaseAdmin();

    const { data, error } = await db
        .from("reviews")
        .select("id, society_key, body, owner_strictness, created_at")
        .eq("society_key", society_key)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
    const requestBody = await request.json();

    const { society_key,
        body: reviewBody,
        owner_strictness } = requestBody;

    if (!society_key || typeof society_key !== "string") {
        return NextResponse.json({ error: "valid society key is required" },
            { status: 400 }
        );
    }

    if (!reviewBody || typeof reviewBody !== "string" || reviewBody.length < 3 || reviewBody.length > 300) {
        return NextResponse.json({ error: "Review must be between 3 and 300 characters" }, { status: 400 });
    }

    const lowerBody = reviewBody.toLowerCase();
    if (BLOCKED_WORDS.some(word => lowerBody.includes(word))) {
        return NextResponse.json(
            { error: "Please keep reviews respectful" },
            { status: 400 }
        );
    }
if (owner_strictness !== undefined && owner_strictness !== null) {
    if (typeof owner_strictness !== "number" || owner_strictness < 1 || owner_strictness > 5) {
        return NextResponse.json(
            { error: "owner_strictness must be a number between 1 and 5" },
            { status: 400 }
        );
    }
}

const db = supabaseAdmin();

const { data, error } = await db
    .from("reviews")
    .insert({
        society_key,
        body: reviewBody,
        owner_strictness: owner_strictness ?? null,
        user_id: null,
    })
    .select()
    .single();

if (error) {
    return NextResponse.json(
        { error: error.message },
        { status: 500 }
    );
}
return NextResponse.json(data, { status: 201 })
}
