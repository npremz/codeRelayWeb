import { NextRequest, NextResponse } from "next/server";
import { parseValue, teamCodeSchema, tokenSchema } from "@/lib/input-validation";
import { getManagedTeam } from "@/lib/team-store";
import { translatePublicErrorMessage } from "@/lib/locale";
import { getLocaleFromRequest } from "@/lib/request-locale";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{
    teamCode: string;
  }>;
};

export async function GET(request: NextRequest, context: Context) {
  const locale = getLocaleFromRequest(request);

  try {
    const { teamCode: rawTeamCode } = await context.params;
    const teamCode = parseValue(rawTeamCode, teamCodeSchema);
    const rawToken = request.nextUrl.searchParams.get("token");

    if (!rawToken) {
      return NextResponse.json({ error: translatePublicErrorMessage("Token manquant.", locale) }, { status: 400 });
    }

    const token = parseValue(rawToken, tokenSchema);
    const team = await getManagedTeam(teamCode, token);

    if (!team) {
      return NextResponse.json({ error: translatePublicErrorMessage("Acces refuse.", locale) }, { status: 403 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acces refuse.";
    return NextResponse.json({ error: translatePublicErrorMessage(message, locale) }, { status: 400 });
  }
}
