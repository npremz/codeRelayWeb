import { NextRequest, NextResponse } from "next/server";
import { AdminAssignSubjectInput } from "@/lib/game-types";
import { getStaffSession } from "@/lib/staff-auth";
import { assignRoundSubject, getCurrentRoundSummary, getRoundState, listRounds } from "@/lib/team-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireAdmin() {
  const session = await getStaffSession();
  return session?.role === "admin";
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Session admin requise." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as AdminAssignSubjectInput;
    const currentRound = await assignRoundSubject(body);
    const [round, rounds] = await Promise.all([getRoundState(), listRounds()]);

    return NextResponse.json({ currentRound, round, rounds });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible d'assigner le sujet." },
      { status: 400 }
    );
  }
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Session admin requise." }, { status: 401 });
  }

  const currentRound = await getCurrentRoundSummary();

  if (!currentRound) {
    return NextResponse.json({ currentRound: null, subject: null });
  }

  return NextResponse.json({ currentRound, subject: currentRound.subject });
}
