import { NextRequest, NextResponse } from "next/server";
import { getManagedTeam } from "@/lib/team-store";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{
    teamCode: string;
  }>;
};

export async function GET(request: NextRequest, context: Context) {
  const { teamCode } = await context.params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token manquant." }, { status: 400 });
  }

  const team = await getManagedTeam(teamCode, token);

  if (!team) {
    return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
  }

  return NextResponse.json({ team });
}
