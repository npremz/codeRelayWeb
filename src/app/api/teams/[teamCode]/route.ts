import { NextRequest, NextResponse } from "next/server";
import { getPublicTeam, updateTeamByToken } from "@/lib/team-store";
import { TeamUpdateInput } from "@/lib/game-types";
import { translatePublicErrorMessage } from "@/lib/locale";
import { getLocaleFromRequest } from "@/lib/request-locale";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{
    teamCode: string;
  }>;
};

export async function GET(_request: NextRequest, context: Context) {
  const locale = getLocaleFromRequest(_request);
  const { teamCode } = await context.params;
  const team = await getPublicTeam(teamCode);

  if (!team) {
    return NextResponse.json({ error: translatePublicErrorMessage("Equipe introuvable.", locale) }, { status: 404 });
  }

  return NextResponse.json({ team });
}

export async function PUT(request: NextRequest, context: Context) {
  const { teamCode } = await context.params;
  const locale = getLocaleFromRequest(request);

  try {
    const body = (await request.json()) as TeamUpdateInput;
    const team = await updateTeamByToken(teamCode, body);

    if (!team) {
      return NextResponse.json({ error: translatePublicErrorMessage("Token invalide.", locale) }, { status: 403 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Impossible de modifier l'equipe.";
    const status = rawMessage.includes("verrouillee") ? 409 : 400;
    return NextResponse.json({ error: translatePublicErrorMessage(rawMessage, locale) }, { status });
  }
}
