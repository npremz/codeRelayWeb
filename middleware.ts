import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/locale";

export function middleware(request: NextRequest) {
  const locale = normalizeLocale(request.nextUrl.searchParams.get("lang"));

  if (!locale) {
    return NextResponse.next();
  }

  const nextUrl = request.nextUrl.clone();
  nextUrl.searchParams.delete("lang");

  const response = NextResponse.redirect(nextUrl);
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax"
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
