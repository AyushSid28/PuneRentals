import { NextResponse } from "next/server";
import { addBachelorVote } from "@/lib/data/pins";
import { voteSchema } from "@/lib/validators/pin";

export async function POST(request: Request) {
  try {
    const body = voteSchema.parse(await request.json());
    const result = await addBachelorVote(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save vote" },
      { status: 400 }
    );
  }
}
