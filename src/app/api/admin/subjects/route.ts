import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/staff-auth";
import { listPublicSubjects } from "@/lib/subject-catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireAdmin() {
  const session = await getStaffSession();
  return session?.role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Session admin requise." }, { status: 401 });
  }

  const subjects = await listPublicSubjects();
  return NextResponse.json({ subjects });
}
