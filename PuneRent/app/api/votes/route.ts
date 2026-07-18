import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";
import { voteSchema } from "@/lib/validators/pin";

export async function POST(request: Request) {

    const body = await request.json();
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Validation failed", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { society_key, bachelors_allowed, visitors_restricted } = parsed.data;
    const db = supabaseAdmin();

    const { data, error } = await db
        .from("bachelor_votes")
        .upsert(
            {
                society_key,
                bachelors_allowed,
                visitors_restricted: visitors_restricted ?? null,
                user_id: null,
            },
            { onConflict: "society_key,user_id" }
        )
        .select()
        .single();

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
    return NextResponse.json(data, { status: 201 });
}
