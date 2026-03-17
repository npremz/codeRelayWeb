import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type StaffRole = "admin" | "judge";

type StaffSession = {
  role: StaffRole;
  expiresAt: number;
};

const STAFF_SESSION_COOKIE = "code-relay-staff";
const STAFF_SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const DEFAULT_ACCESS_CODES: Record<StaffRole, string> = {
  admin: "admin-relay",
  judge: "judge-relay"
};
const DEFAULT_SESSION_SECRET = "code-relay-local-session-secret";

function getSessionSecret() {
  return process.env.CODE_RELAY_SESSION_SECRET?.trim() || DEFAULT_SESSION_SECRET;
}

export function getAccessCode(role: StaffRole) {
  if (role === "admin") {
    return process.env.CODE_RELAY_ADMIN_CODE?.trim() || DEFAULT_ACCESS_CODES.admin;
  }

  return process.env.CODE_RELAY_JUDGE_CODE?.trim() || DEFAULT_ACCESS_CODES.judge;
}

function signSession(role: StaffRole, expiresAt: number) {
  return createHmac("sha256", getSessionSecret()).update(`${role}.${expiresAt}`).digest("hex");
}

function encodeSession(session: StaffSession) {
  const signature = signSession(session.role, session.expiresAt);
  return `${session.role}.${session.expiresAt}.${signature}`;
}

function decodeSession(raw: string | undefined): StaffSession | null {
  if (!raw) {
    return null;
  }

  const [roleValue, expiresValue, signature] = raw.split(".");

  if ((roleValue !== "admin" && roleValue !== "judge") || !expiresValue || !signature) {
    return null;
  }

  const expiresAt = Number(expiresValue);

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  const expected = signSession(roleValue, expiresAt);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  return {
    role: roleValue,
    expiresAt
  };
}

export function verifyAccessCode(role: StaffRole, candidate: string) {
  return candidate.trim() === getAccessCode(role);
}

export async function createStaffSessionCookie(role: StaffRole) {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + STAFF_SESSION_TTL_MS;

  cookieStore.set(STAFF_SESSION_COOKIE, encodeSession({ role, expiresAt }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export async function clearStaffSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_SESSION_COOKIE);
}

export async function getStaffSession() {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(STAFF_SESSION_COOKIE)?.value);
}

function roleSatisfies(requiredRole: StaffRole, currentRole: StaffRole) {
  if (currentRole === "admin") {
    return true;
  }

  return requiredRole === currentRole;
}

export async function requireStaffRole(requiredRole: StaffRole) {
  const session = await getStaffSession();

  if (!session || !roleSatisfies(requiredRole, session.role)) {
    redirect(`/staff?role=${requiredRole}&next=/${requiredRole}`);
  }

  return session;
}
