import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, parseValue, teamCodeSchema, teamScoreInputSchema } from "@/lib/input-validation";
import { getStaffSession } from "@/lib/staff-auth";
import { updateTeamScore } from "@/lib/team-store";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{
    teamCode: string;
  }>;
};

export async function PUT(request: NextRequest, context: Context) {
  const session = await getStaffSession();

  if (!session) {
    return NextResponse.json({ error: "Session staff requise." }, { status: 401 });
  }

  try {
    const { teamCode: rawTeamCode } = await context.params;
    const teamCode = parseValue(rawTeamCode, teamCodeSchema);
    const body = await parseJsonBody(request, teamScoreInputSchema);
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
