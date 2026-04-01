import "server-only";

import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, Locale, normalizeLocale } from "@/lib/locale";

type LocaleSource = "cookie" | "header" | "default";

export type RequestLocaleState = {
  locale: Locale;
  source: LocaleSource;
};

function parseHeaderLocale(value: string | null | undefined): Locale | null {
  if (!value) {
    return null;
  }

  const segments = value.split(",");

  for (const segment of segments) {
    const candidate = segment.split(";")[0]?.trim();
    const locale = normalizeLocale(candidate);
    if (locale) {
      return locale;
    }
  }

  return null;
}

export async function getRequestLocaleState(): Promise<RequestLocaleState> {
  const cookieStore = await cookies();
  const cookieLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);

  if (cookieLocale) {
    return { locale: cookieLocale, source: "cookie" };
  }

  const headerStore = await headers();
  const headerLocale = parseHeaderLocale(headerStore.get("accept-language"));

  if (headerLocale) {
    return { locale: headerLocale, source: "header" };
  }

  return { locale: DEFAULT_LOCALE, source: "default" };
}

export async function getRequestLocale(): Promise<Locale> {
  return (await getRequestLocaleState()).locale;
}

export function getLocaleFromRequest(request: NextRequest): Locale {
  const cookieLocale = normalizeLocale(request.cookies.get(LOCALE_COOKIE_NAME)?.value);

  if (cookieLocale) {
    return cookieLocale;
  }

  return parseHeaderLocale(request.headers.get("accept-language")) ?? DEFAULT_LOCALE;
}
