import { NextRequest, NextResponse } from "next/server";
import { AdminRoundAction } from "@/lib/game-types";
import { getStaffSession } from "@/lib/staff-auth";
import { applyAdminRoundAction, getRoundState } from "@/lib/team-store";

export const dynamic = "force-dynamic";

type RoundActionBody = {
  action?: AdminRoundAction;
};

async function requireAdmin() {
  const session = await getStaffSession();
  return session?.role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Session admin requise." }, { status: 401 });
  }

  return NextResponse.json({ round: await getRoundState() });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Session admin requise." }, { status: 401 });
  }

  const body = (await request.json()) as RoundActionBody;

  if (!body.action) {
    return NextResponse.json({ error: "Action admin manquante." }, { status: 400 });
  }

  const round = await applyAdminRoundAction(body.action);
  return NextResponse.json({ round });
}
