import { NextRequest, NextResponse } from "next/server";
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
  const { teamCode } = await context.params;
  const token = request.nextUrl.searchParams.get("token");
  const locale = getLocaleFromRequest(request);

  if (!token) {
    return NextResponse.json({ error: translatePublicErrorMessage("Token manquant.", locale) }, { status: 400 });
  }

  const team = await getManagedTeam(teamCode, token);

  if (!team) {
    return NextResponse.json({ error: translatePublicErrorMessage("Acces refuse.", locale) }, { status: 403 });
  }

  return NextResponse.json({ team });
}
