import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, roundActionInputSchema } from "@/lib/input-validation";
import { getStaffSession } from "@/lib/staff-auth";
import { applyAdminRoundAction, getCurrentRoundSummary, getRoundState } from "@/lib/team-store";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getStaffSession();
  return session?.role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Session admin requise." }, { status: 401 });
  }

  const [round, currentRound] = await Promise.all([getRoundState(), getCurrentRoundSummary()]);

  return NextResponse.json({ round, currentRound });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Session admin requise." }, { status: 401 });
  }

  try {
    const body = await parseJsonBody(request, roundActionInputSchema);
    const round = await applyAdminRoundAction(body.action);
    const currentRound = await getCurrentRoundSummary();

    return NextResponse.json({ round, currentRound });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Action admin impossible." },
      { status: 400 }
    );
  }
}
