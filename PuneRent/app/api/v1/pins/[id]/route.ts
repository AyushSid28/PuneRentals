import { NextResponse } from "next/server";
import { getIntelligenceByPinId } from "@/lib/data/pins";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const intelligence = await getIntelligenceByPinId(id);

    if (!intelligence) {
      return NextResponse.json({ error: "Pin not found" }, { status: 404 });
    }

    return NextResponse.json(intelligence);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load pin" },
      { status: 500 }
    );
  }
}
