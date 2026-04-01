import { NextRequest, NextResponse } from "next/server";
import { createTeam, listStoredTeams } from "@/lib/team-store";
import { TeamCreateInput } from "@/lib/game-types";
import { translatePublicErrorMessage } from "@/lib/locale";
import { getLocaleFromRequest } from "@/lib/request-locale";

export const dynamic = "force-dynamic";

export async function GET() {
  const teams = await listStoredTeams();
  return NextResponse.json({ teams });
}

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request);

  try {
    const body = (await request.json()) as TeamCreateInput;
    const created = await createTeam(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de creer l'equipe.";
    return NextResponse.json(
      { error: translatePublicErrorMessage(message, locale) },
      { status: 400 }
    );
  }
}
