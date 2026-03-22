import { NextRequest, NextResponse } from "next/server";
import { getStaffSession } from "@/lib/staff-auth";
import { markTeamSubmitted } from "@/lib/team-store";

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

export async function POST(_request: NextRequest, context: Context) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Session admin requise." }, { status: 401 });
  }

  try {
    const { teamCode } = await context.params;
    const team = await markTeamSubmitted(teamCode);

    if (!team) {
      return NextResponse.json({ error: "Equipe introuvable." }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impossible de marquer la soumission." },
      { status: 400 }
    );
  }
}
