import { NextResponse } from "next/server";
import { listStoredTeams, getRoundState } from "@/lib/team-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const teams = await listStoredTeams();
  const round = await getRoundState();

  return NextResponse.json({
    teams,
    round,
    usingDemoData: false
  });
}
