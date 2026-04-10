import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, staffSessionInputSchema } from "@/lib/input-validation";
import {
  clearStaffSessionCookie,
  createStaffSessionCookie,
  resolveRoleFromAccessCode,
  verifyAccessCode
} from "@/lib/staff-auth";
import { translatePublicErrorMessage } from "@/lib/locale";
import { getLocaleFromRequest } from "@/lib/request-locale";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request);

  try {
    const body = await parseJsonBody(request, staffSessionInputSchema);
    const requestedRole = body.role;
    const code = body.code;
    const resolvedRole =
      verifyAccessCode(requestedRole, code)
        ? requestedRole
        : resolveRoleFromAccessCode(code);

    if (!resolvedRole) {
      return NextResponse.json({ error: translatePublicErrorMessage("Code d'acces invalide.", locale) }, { status: 401 });
    }

    await createStaffSessionCookie(resolvedRole);

    const redirectPath =
      body.nextPath && body.nextPath.startsWith(`/${resolvedRole}`)
        ? body.nextPath
        : resolvedRole === "admin"
          ? "/admin"
          : "/judge";

    return NextResponse.json({
      ok: true,
      redirectPath
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Code d'acces invalide.";
    return NextResponse.json({ error: translatePublicErrorMessage(message, locale) }, { status: 400 });
  }
}

export async function DELETE() {
  await clearStaffSessionCookie();
  return NextResponse.json({ ok: true });
}
