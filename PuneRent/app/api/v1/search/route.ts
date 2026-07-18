import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, supabaseAdmin } from "@/lib/db/client";
import * as store from "@/lib/db/store";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase().trim();

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    // --- 1. Fetch from Local Database ---
    let dbResults: any[] = [];
    if (hasSupabase()) {
        const db = supabaseAdmin();
        const { data } = await db
            .from("rent_observations")
            .select("society_name,area_slug,society_key,lat,lng")
            .or(`society_name.ilike.%${query}%,area_slug.ilike.%${query}%`)
            .eq("status", "active")
            .limit(10);
        dbResults = data ?? [];
    } else {
        const allObservations = store.listObservations();
        dbResults = allObservations
            .filter(o => o.status === "active" && (o.society_name.toLowerCase().includes(query) || o.area_slug.toLowerCase().includes(query)))
            .map(o => ({ society_name: o.society_name, area_slug: o.area_slug, society_key: o.society_key, lat: o.lat, lng: o.lng }));
    }

    // Deduplicate DB results
    const uniqueDb = Array.from(new Map(dbResults.map(item => [item.society_key, item])).values()).slice(0, 5);
    const formattedDb = uniqueDb.map(item => ({
        type: "db",
        id: item.society_key,
        name: item.society_name,
        subtitle: `Local Pin · ${item.area_slug}`,
        lat: item.lat,
        lng: item.lng
    }));

    // --- 2. Fetch from OpenStreetMap (Nominatim) ---
    let globalResults: any[] = [];
    try {
        // Append Pune to narrow down the global search
        const nomQuery = encodeURIComponent(`${query} Pune`);
        // We use viewbox and bounded=1 to strictly search within Pune coordinates
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${nomQuery}&format=json&limit=5&viewbox=73.5,18.8,74.2,18.3&bounded=1`, {
            headers: {
                "User-Agent": "PuneRentalsApp/1.0" // Nominatim requires a user agent
            }
        });

        if (nomRes.ok) {
            const nomData = await nomRes.json();
            globalResults = nomData.map((item: any) => ({
                type: "global",
                id: item.place_id.toString(),
                name: item.display_name.split(",")[0], // Keep the first part of the name
                subtitle: "Global Map Location",
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
            }));
        }
    } catch (err) {
        console.error("Nominatim error:", err);
    }

    // --- 3. Merge and Return ---
    return NextResponse.json({
        results: [...formattedDb, ...globalResults]
    });
}
