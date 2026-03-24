const DEFAULT_PUBLIC_APP_URL = "https://coderelay.hordeagence.com";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getPublicAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return normalizeBaseUrl(configuredUrl || DEFAULT_PUBLIC_APP_URL);
}

export function getPublicBriefUrl() {
  const configuredBriefUrl = process.env.NEXT_PUBLIC_PUBLIC_BRIEF_URL?.trim();

  if (configuredBriefUrl) {
    return configuredBriefUrl;
  }

  return `${getPublicAppUrl()}/brief`;
}
