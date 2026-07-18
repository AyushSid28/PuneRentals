import { NextResponse } from "next/server";
import { createObservation, listMapPins } from "@/lib/data/pins";

export async function GET() {
  try {
    const pins = await listMapPins();
    return NextResponse.json({ pins });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load pins" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createObservation(body);
    return NextResponse.json(result, { status: result.ok ? 201 : 422 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create pin" },
      { status: 400 }
    );
  }
}
