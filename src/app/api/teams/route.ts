import { NextRequest, NextResponse } from "next/server";
import { createTeam, listStoredTeams } from "@/lib/team-store";
import { TeamCreateInput } from "@/lib/game-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const teams = await listStoredTeams();
  return NextResponse.json({ teams });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TeamCreateInput;
    const created = await createTeam(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de creer l'equipe." },
      { status: 400 }
    );
  }
}
