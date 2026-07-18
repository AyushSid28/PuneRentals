import { NextResponse } from "next/server";
import { getIntelligenceByPinId } from "@/lib/data/pins";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const payload = await getIntelligenceByPinId(id);
  if (!payload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(payload);
}
