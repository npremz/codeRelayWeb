import { NextResponse } from "next/server";
import { demoTeams } from "@/lib/demo-game";
import { PublicTeam } from "@/lib/game-types";
import { listStoredTeams } from "@/lib/team-store";

export const dynamic = "force-dynamic";

function getDemoPublicTeams(): PublicTeam[] {
  const now = new Date().toISOString();

  return demoTeams.map((team, index) => ({
    ...team,
    teamCode: `DEMO${index + 1}`,
    createdAt: now,
    updatedAt: now,
    locked: false
  }));
}

export async function GET() {
  const teams = await listStoredTeams();
  const usingDemoData = teams.length === 0;

  return NextResponse.json({
    teams: usingDemoData ? getDemoPublicTeams() : teams,
    usingDemoData
  });
}
