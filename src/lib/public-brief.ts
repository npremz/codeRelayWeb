import { Locale, withLocaleQuery } from "@/lib/locale";

const DEFAULT_PUBLIC_APP_URL = "https://coderelay.hordeagence.com";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getPublicAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return normalizeBaseUrl(configuredUrl || DEFAULT_PUBLIC_APP_URL);
}

export function getPublicBriefUrl(locale?: Locale) {
  const configuredBriefUrl = process.env.NEXT_PUBLIC_PUBLIC_BRIEF_URL?.trim();
  const url = configuredBriefUrl || `${getPublicAppUrl()}/brief`;

  return locale ? withLocaleQuery(url, locale) : url;
}

export function getPublicRegisterUrl(locale?: Locale) {
  const configuredRegisterUrl = process.env.NEXT_PUBLIC_PUBLIC_REGISTER_URL?.trim();
  const url = configuredRegisterUrl || `${getPublicAppUrl()}/register`;

  return locale ? withLocaleQuery(url, locale) : url;
}
