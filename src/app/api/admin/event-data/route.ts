import { NextRequest, NextResponse } from "next/server";
import { AdminResetEventInput } from "@/lib/game-types";
import { getStaffSession } from "@/lib/staff-auth";
import { getRoundState, listRounds, resetEventData } from "@/lib/team-store";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getStaffSession();
  return session?.role === "admin";
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Session admin requise." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as AdminResetEventInput;
    const currentRound = await resetEventData(body);
    const [round, rounds] = await Promise.all([getRoundState(), listRounds()]);

    return NextResponse.json({ currentRound, round, rounds });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de reinitialiser l'edition." },
      { status: 400 }
    );
  }
}
