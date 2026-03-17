import { NextRequest, NextResponse } from "next/server";
import { AdminCreateRoundInput } from "@/lib/game-types";
import { getStaffSession } from "@/lib/staff-auth";
import { createRound, getCurrentRoundSummary, listRounds } from "@/lib/team-store";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getStaffSession();
  return session?.role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Session admin requise." }, { status: 401 });
  }

  const [rounds, currentRound] = await Promise.all([listRounds(), getCurrentRoundSummary()]);

  return NextResponse.json({ rounds, currentRound });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Session admin requise." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as AdminCreateRoundInput;
    const round = await createRound(body);
    const [rounds, currentRound] = await Promise.all([listRounds(), getCurrentRoundSummary()]);

    return NextResponse.json({ round, rounds, currentRound }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de creer la manche." },
      { status: 400 }
    );
  }
}
