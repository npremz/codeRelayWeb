import { NextRequest, NextResponse } from "next/server";
import {
  StaffRole,
  clearStaffSessionCookie,
  createStaffSessionCookie,
  resolveRoleFromAccessCode,
  verifyAccessCode
} from "@/lib/staff-auth";
import { translatePublicErrorMessage } from "@/lib/locale";
import { getLocaleFromRequest } from "@/lib/request-locale";

export const dynamic = "force-dynamic";

type SessionBody = {
  role?: StaffRole;
  code?: string;
  nextPath?: string;
};

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request);
  const body = (await request.json()) as SessionBody;
  const requestedRole = body.role;
  const code = body.code ?? "";

  if (requestedRole !== "admin" && requestedRole !== "judge") {
    return NextResponse.json({ error: translatePublicErrorMessage("Role invalide.", locale) }, { status: 400 });
  }

  const resolvedRole =
    verifyAccessCode(requestedRole, code)
      ? requestedRole
      : resolveRoleFromAccessCode(code);

  if (!resolvedRole) {
    return NextResponse.json({ error: translatePublicErrorMessage("Code d'acces invalide.", locale) }, { status: 401 });
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
