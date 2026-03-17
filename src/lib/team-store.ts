import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { join } from "node:path";
import {
  PublicTeam,
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
  version: 1;
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
      version: 1,
      teams: []
    };

    await writeFile(STORE_FILE, JSON.stringify(initialStore, null, 2));
  }
}

async function readStore(): Promise<TeamStore> {
  await ensureStore();
  const raw = await readFile(STORE_FILE, "utf8");
  return JSON.parse(raw) as TeamStore;
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

export async function getPublicTeam(teamCode: string): Promise<PublicTeam | null> {
  const store = await readStore();
  const team = findTeamByCode(store, teamCode);
  return team ? toPublicTeam(team) : null;
}

export async function createTeam(input: TeamCreateInput): Promise<TeamCreateResponse> {
  return mutateStore(async (store) => {
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
