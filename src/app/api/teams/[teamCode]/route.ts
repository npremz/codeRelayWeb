import { NextRequest, NextResponse } from "next/server";
import { getPublicTeam, updateTeamByToken } from "@/lib/team-store";
import { TeamUpdateInput } from "@/lib/game-types";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{
    teamCode: string;
  }>;
};

export async function GET(_request: NextRequest, context: Context) {
  const { teamCode } = await context.params;
  const team = await getPublicTeam(teamCode);

  if (!team) {
    return NextResponse.json({ error: "Equipe introuvable." }, { status: 404 });
  }

  return NextResponse.json({ team });
}

export async function PUT(request: NextRequest, context: Context) {
  const { teamCode } = await context.params;

  try {
    const body = (await request.json()) as TeamUpdateInput;
    const team = await updateTeamByToken(teamCode, body);

    if (!team) {
      return NextResponse.json({ error: "Token invalide." }, { status: 403 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de modifier l'equipe.";
    const status = message.includes("verrouillee") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
