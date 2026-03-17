import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { join } from "node:path";
import { defaultRoundState } from "@/lib/demo-game";
import {
  AdminRoundAction,
  PublicTeam,
  RoundControlState,
  TeamCreateInput,
  TeamCreateResponse,
  TeamMember,
  TeamScoreInput,
  TeamStatus,
  TeamUpdateInput
} from "@/lib/game-types";

type StoredTeam = {
  id: string;
  teamCode: string;
  editTokenHash: string;
  name: string;
  station: string;
  members: TeamMember[];
  status: TeamStatus;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  score: {
    correction: number;
    edgeCases: number;
    complexity: number;
    readability: number;
    notes?: string;
  };
};

type TeamStore = {
  version: 2;
  round: RoundControlState;
  teams: StoredTeam[];
};

const STORE_DIR = join(process.cwd(), "data");
const STORE_FILE = join(STORE_DIR, "team-store.json");
const TEAM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

let mutationQueue: Promise<unknown> = Promise.resolve();

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken() {
  return randomBytes(24).toString("base64url");
}

function generateTeamCode(existingCodes: Set<string>) {
  let code = "";

  do {
    code = Array.from({ length: 5 }, () => {
      const index = Math.floor(Math.random() * TEAM_CODE_ALPHABET.length);
      return TEAM_CODE_ALPHABET[index];
    }).join("");
  } while (existingCodes.has(code));

  return code;
}

function getNextStationLabel(count: number) {
  return `PC-${String(count + 1).padStart(2, "0")}`;
}

function toPublicTeam(team: StoredTeam): PublicTeam {
  return {
    id: team.id,
    teamCode: team.teamCode,
    name: team.name,
    station: team.station,
    members: team.members,
    status: team.status,
    submittedAt: team.submittedAt,
    score: team.score,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    locked: team.locked
  };
}

async function ensureStore() {
  await mkdir(STORE_DIR, { recursive: true });

  try {
    await readFile(STORE_FILE, "utf8");
  } catch {
    const initialStore: TeamStore = {
      version: 2,
      round: {
        ...defaultRoundState,
        updatedAt: new Date().toISOString()
      },
      teams: []
    };

    await writeFile(STORE_FILE, JSON.stringify(initialStore, null, 2));
  }
}

function createDefaultRoundState(): RoundControlState {
  return {
    ...defaultRoundState,
    updatedAt: new Date().toISOString()
  };
}

function normalizeRoundState(input: Partial<RoundControlState> | undefined): RoundControlState {
  const base = createDefaultRoundState();

  return {
    registrationOpen: input?.registrationOpen ?? base.registrationOpen,
    phase: input?.phase ?? base.phase,
    previousPhase: input?.previousPhase ?? base.previousPhase,
    phaseStartedAt: input?.phaseStartedAt ?? base.phaseStartedAt,
    pausedElapsedMs: input?.pausedElapsedMs ?? base.pausedElapsedMs,
    reflectionMs: input?.reflectionMs ?? base.reflectionMs,
    relaySliceMs: input?.relaySliceMs ?? base.relaySliceMs,
    totalRelaySlices: input?.totalRelaySlices ?? base.totalRelaySlices,
    updatedAt: input?.updatedAt ?? base.updatedAt
  };
}

function migrateStore(raw: unknown): TeamStore {
  if (!raw || typeof raw !== "object") {
    return {
      version: 2,
      round: createDefaultRoundState(),
      teams: []
    };
  }

  const candidate = raw as Partial<TeamStore> & { version?: number };

  if (candidate.version === 2 && Array.isArray(candidate.teams)) {
    return {
      version: 2,
      round: normalizeRoundState(candidate.round),
      teams: candidate.teams
    };
  }

  if (Array.isArray(candidate.teams)) {
    return {
      version: 2,
      round: createDefaultRoundState(),
      teams: candidate.teams
    };
  }

  return {
    version: 2,
    round: createDefaultRoundState(),
    teams: []
  };
}

async function readStore(): Promise<TeamStore> {
  await ensureStore();
  const raw = await readFile(STORE_FILE, "utf8");
  return migrateStore(JSON.parse(raw));
}

async function writeStore(store: TeamStore) {
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2));
}

async function mutateStore<T>(mutation: (store: TeamStore) => T | Promise<T>): Promise<T> {
  const next = mutationQueue.then(async () => {
    const store = await readStore();
    const result = await mutation(store);
    await writeStore(store);
    return result;
  });

  mutationQueue = next.catch(() => undefined);
  return next;
}

function normalizeNames(input: TeamCreateInput) {
  const name = input.name.trim();
  const members = input.members.map((member) => member.trim());

  if (name.length < 2) {
    throw new Error("Le nom d'equipe doit contenir au moins 2 caracteres.");
  }

  if (members.length !== 3 || members.some((member) => member.length < 2)) {
    throw new Error("Il faut exactement 3 membres avec un nom valide.");
  }

  return { name, members };
}

function findTeamByCode(store: TeamStore, teamCode: string) {
  return store.teams.find((team) => team.teamCode === teamCode.toUpperCase());
}

export async function listStoredTeams(): Promise<PublicTeam[]> {
  const store = await readStore();
  return store.teams
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(toPublicTeam);
}

export async function getRoundState(): Promise<RoundControlState> {
  const store = await readStore();
  return store.round;
}

export async function getPublicTeam(teamCode: string): Promise<PublicTeam | null> {
  const store = await readStore();
  const team = findTeamByCode(store, teamCode);
  return team ? toPublicTeam(team) : null;
}

export async function createTeam(input: TeamCreateInput): Promise<TeamCreateResponse> {
  return mutateStore(async (store) => {
    if (!store.round.registrationOpen) {
      throw new Error("Les inscriptions sont fermees.");
    }

    const { name, members } = normalizeNames(input);
    const teamCode = generateTeamCode(new Set(store.teams.map((team) => team.teamCode)));
    const editToken = generateToken();
    const now = new Date().toISOString();
    const nextTeam: StoredTeam = {
      id: randomUUID(),
      teamCode,
      editTokenHash: hashToken(editToken),
      name,
      station: getNextStationLabel(store.teams.length),
      members: members.map((member, index) => ({
        id: randomUUID(),
        name: member,
        relayOrder: index + 1
      })),
      status: "registered",
      locked: false,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      score: {
        correction: 0,
        edgeCases: 0,
        complexity: 0,
        readability: 0,
        notes: ""
      }
    };

    store.teams.push(nextTeam);

    return {
      team: toPublicTeam(nextTeam),
      editToken,
      managePath: `/team/${teamCode}/manage?token=${editToken}`
    };
  });
}

export async function getManagedTeam(teamCode: string, token: string): Promise<PublicTeam | null> {
  const store = await readStore();
  const team = findTeamByCode(store, teamCode);

  if (!team || team.editTokenHash !== hashToken(token)) {
    return null;
  }

  return toPublicTeam(team);
}

export async function updateTeamByToken(teamCode: string, input: TeamUpdateInput): Promise<PublicTeam | null> {
  return mutateStore(async (store) => {
    const team = findTeamByCode(store, teamCode);

    if (!team || team.editTokenHash !== hashToken(input.token)) {
      return null;
    }

    if (team.locked) {
      throw new Error("Cette equipe est verrouillee.");
    }

    const { name, members } = normalizeNames(input);
    team.name = name;
    team.members = members.map((member, index) => ({
      id: team.members[index]?.id ?? randomUUID(),
      name: member,
      relayOrder: index + 1
    }));
    team.updatedAt = new Date().toISOString();

    return toPublicTeam(team);
  });
}

export async function updateTeamScore(teamCode: string, input: TeamScoreInput): Promise<PublicTeam | null> {
  return mutateStore(async (store) => {
    const team = findTeamByCode(store, teamCode);

    if (!team) {
      return null;
    }

    team.score = {
      correction: Math.max(0, Math.min(40, input.correction)),
      edgeCases: Math.max(0, Math.min(20, input.edgeCases)),
      complexity: Math.max(0, Math.min(20, input.complexity)),
      readability: Math.max(0, Math.min(10, input.readability)),
      notes: input.notes?.trim() ?? ""
    };
    team.status = "scored";
    team.updatedAt = new Date().toISOString();

    return toPublicTeam(team);
  });
}

function lockPendingTeams(store: TeamStore, locked: boolean) {
  for (const team of store.teams) {
    if (team.status !== "submitted" && team.status !== "scored") {
      team.locked = locked;
      if (!locked && team.status === "ready") {
        team.status = "registered";
      }
    }
  }
}

function getElapsedForPhase(round: RoundControlState, now: Date) {
  if (!round.phaseStartedAt) {
    return round.pausedElapsedMs ?? 0;
  }

  return Math.max(0, now.getTime() - new Date(round.phaseStartedAt).getTime());
}

export async function applyAdminRoundAction(action: AdminRoundAction): Promise<RoundControlState> {
  return mutateStore(async (store) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const round = store.round;

    switch (action) {
      case "open_registration":
        round.registrationOpen = true;
        round.updatedAt = nowIso;
        if (round.phase === "draft" || round.phase === "complete") {
          lockPendingTeams(store, false);
        }
        break;
      case "close_registration":
        round.registrationOpen = false;
        round.updatedAt = nowIso;
        lockPendingTeams(store, true);
        break;
      case "start_reflection":
        round.registrationOpen = false;
        round.phase = "reflection";
        round.previousPhase = null;
        round.phaseStartedAt = nowIso;
        round.pausedElapsedMs = null;
        round.updatedAt = nowIso;
        lockPendingTeams(store, true);
        for (const team of store.teams) {
          if (team.status !== "submitted" && team.status !== "scored") {
            team.status = "ready";
            team.submittedAt = null;
            team.updatedAt = nowIso;
          }
        }
        break;
      case "start_relay":
        round.registrationOpen = false;
        round.phase = "relay";
        round.previousPhase = null;
        round.phaseStartedAt = nowIso;
        round.pausedElapsedMs = null;
        round.updatedAt = nowIso;
        lockPendingTeams(store, true);
        for (const team of store.teams) {
          if (team.status !== "submitted" && team.status !== "scored") {
            team.status = "coding";
            team.updatedAt = nowIso;
          }
        }
        break;
      case "pause_round":
        if (round.phase === "reflection" || round.phase === "relay") {
          round.previousPhase = round.phase;
          round.phase = "paused";
          round.pausedElapsedMs = getElapsedForPhase(round, now);
          round.phaseStartedAt = null;
          round.updatedAt = nowIso;
        }
        break;
      case "resume_round":
        if (round.phase === "paused" && round.previousPhase) {
          round.phase = round.previousPhase;
          round.phaseStartedAt = new Date(now.getTime() - (round.pausedElapsedMs ?? 0)).toISOString();
          round.pausedElapsedMs = null;
          round.previousPhase = null;
          round.updatedAt = nowIso;
        }
        break;
      case "close_round":
        round.registrationOpen = false;
        round.phase = "complete";
        round.previousPhase = null;
        round.phaseStartedAt = null;
        round.pausedElapsedMs = null;
        round.updatedAt = nowIso;
        lockPendingTeams(store, true);
        break;
      default:
        break;
    }

    return round;
  });
}

export async function markTeamSubmitted(teamCode: string): Promise<PublicTeam | null> {
  return mutateStore(async (store) => {
    const team = findTeamByCode(store, teamCode);

    if (!team) {
      return null;
    }

    const nowIso = new Date().toISOString();

    if (!team.submittedAt) {
      team.submittedAt = nowIso;
    }

    if (team.status !== "scored") {
      team.status = "submitted";
    }

    team.locked = true;
    team.updatedAt = nowIso;

    return toPublicTeam(team);
  });
}
