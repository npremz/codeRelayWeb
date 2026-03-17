const STORAGE_KEY = "code-relay-team-access";

export type TeamAccessMap = Record<string, string>;

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredTeamAccess(): TeamAccessMap {
  if (!isBrowser()) {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as TeamAccessMap;
  } catch {
    return {};
  }
}

export function storeTeamAccess(teamCode: string, token: string) {
  if (!isBrowser()) {
    return;
  }

  const current = getStoredTeamAccess();
  current[teamCode] = token;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function getStoredToken(teamCode: string): string | null {
  const current = getStoredTeamAccess();
  return current[teamCode] ?? null;
}
