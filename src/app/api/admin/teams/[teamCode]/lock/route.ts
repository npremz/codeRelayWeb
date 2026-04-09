import { NextRequest, NextResponse } from "next/server";
import { AdminTeamLockInput } from "@/lib/game-types";
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
    const body = (await request.json()) as AdminTeamLockInput;

    if (typeof body.locked !== "boolean") {
      return NextResponse.json({ error: "Etat de verrouillage manquant." }, { status: 400 });
    }

    const { teamCode } = await context.params;
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
