import { NextRequest, NextResponse } from "next/server";
import {
  StaffRole,
  clearStaffSessionCookie,
  createStaffSessionCookie,
  resolveRoleFromAccessCode,
  verifyAccessCode
} from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

type SessionBody = {
  role?: StaffRole;
  code?: string;
  nextPath?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SessionBody;
  const requestedRole = body.role;
  const code = body.code ?? "";

  if (requestedRole !== "admin" && requestedRole !== "judge") {
    return NextResponse.json({ error: "Role invalide." }, { status: 400 });
  }

  const resolvedRole =
    verifyAccessCode(requestedRole, code)
      ? requestedRole
      : resolveRoleFromAccessCode(code);

  if (!resolvedRole) {
    return NextResponse.json({ error: "Code d'acces invalide." }, { status: 401 });
  }

  await createStaffSessionCookie(resolvedRole);

  const redirectPath =
    body.nextPath && body.nextPath.startsWith("/") && body.nextPath.startsWith(`/${resolvedRole}`)
      ? body.nextPath
      : resolvedRole === "admin"
        ? "/admin"
        : "/judge";

  return NextResponse.json({
    ok: true,
    redirectPath
  });
}

export async function DELETE() {
  await clearStaffSessionCookie();
  return NextResponse.json({ ok: true });
}
