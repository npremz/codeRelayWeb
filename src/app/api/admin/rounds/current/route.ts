import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, selectRoundInputSchema } from "@/lib/input-validation";
import { getStaffSession } from "@/lib/staff-auth";
import { getRoundState, listRounds, setCurrentRound } from "@/lib/team-store";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getStaffSession();
  return session?.role === "admin";
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Session admin requise." }, { status: 401 });
  }

  try {
    const body = await parseJsonBody(request, selectRoundInputSchema);
    const currentRound = await setCurrentRound(body);
    const [round, rounds] = await Promise.all([getRoundState(), listRounds()]);

    return NextResponse.json({ currentRound, round, rounds });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de changer la manche courante." },
      { status: 400 }
    );
  }
}
