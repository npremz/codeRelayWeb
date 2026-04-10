import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, parseValue, teamCodeSchema, teamLockInputSchema } from "@/lib/input-validation";
import { getStaffSession } from "@/lib/staff-auth";
import { setTeamLockState } from "@/lib/team-store";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{
    teamCode: string;
  }>;
};

async function requireAdmin() {
  const session = await getStaffSession();
  return session?.role === "admin";
}

export async function PUT(request: NextRequest, context: Context) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Session admin requise." }, { status: 401 });
  }

  try {
    const { teamCode: rawTeamCode } = await context.params;
    const teamCode = parseValue(rawTeamCode, teamCodeSchema);
    const body = await parseJsonBody(request, teamLockInputSchema);
    const team = await setTeamLockState(teamCode, body.locked);

    if (!team) {
      return NextResponse.json({ error: "Equipe introuvable." }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de changer le verrouillage de l'equipe." },
      { status: 400 }
    );
  }
}
