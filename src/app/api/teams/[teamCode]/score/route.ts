import { NextRequest, NextResponse } from "next/server";
import { TeamScoreInput } from "@/lib/game-types";
import { updateTeamScore } from "@/lib/team-store";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{
    teamCode: string;
  }>;
};

export async function PUT(request: NextRequest, context: Context) {
  const { teamCode } = await context.params;

  try {
    const body = (await request.json()) as TeamScoreInput;
    const team = await updateTeamScore(teamCode, body);

    if (!team) {
      return NextResponse.json({ error: "Equipe introuvable." }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de noter l'equipe." },
      { status: 400 }
    );
  }
}
