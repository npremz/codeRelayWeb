import { NextRequest, NextResponse } from "next/server";
import { StaffRole, clearStaffSessionCookie, createStaffSessionCookie, verifyAccessCode } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

type SessionBody = {
  role?: StaffRole;
  code?: string;
  nextPath?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SessionBody;
  const role = body.role;
  const code = body.code ?? "";

  if (role !== "admin" && role !== "judge") {
    return NextResponse.json({ error: "Role invalide." }, { status: 400 });
  }

  if (!verifyAccessCode(role, code)) {
    return NextResponse.json({ error: "Code d'acces invalide." }, { status: 401 });
  }

  await createStaffSessionCookie(role);

  return NextResponse.json({
    ok: true,
    redirectPath: body.nextPath && body.nextPath.startsWith("/") ? body.nextPath : role === "admin" ? "/admin" : "/judge"
  });
}

export async function DELETE() {
  await clearStaffSessionCookie();
  return NextResponse.json({ ok: true });
}
