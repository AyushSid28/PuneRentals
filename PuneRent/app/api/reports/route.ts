import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/client";
import { reportSchema } from "@/lib/validators/pin";

const HIDE_THRESHOLD = 3;

export async function POST(request: Request) {

    const body = await request.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "validation failed", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { observation_id, reason } = parsed.data;
    const db = supabaseAdmin();

    const { data: pin, error: pinError } = await db
        .from("rent_observations")
        .select("id")
        .eq("id", observation_id)
        .single();

    if (pinError || !pin) {
        return NextResponse.json(
            { error: "Observation not found" },
            { status: 404 }
        );
    }

    const { error: insertError } = await db
        .from("reports")
        .insert({
            observation_id,
            reason,
            user_id: null,

        });

    if (insertError) {
        return NextResponse.json(
            { error: insertError.message },
            { status: 500 }
        );
    }

    const { count } = await db
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("observation_id", observation_id);

    if (count !== null && count >= HIDE_THRESHOLD) {
        await db
            .from("rent_observations")
            .update({
                status: "hidden",
                outlier_reason: `Auto-hidden: ${count} community reports`,
            })
            .eq("id", observation_id);
    }

    return NextResponse.json(
        {
            message: "Report Submitted",
            auto_hidden: count !== null && count >= HIDE_THRESHOLD,
        },
        { status: 201 }
    );

}