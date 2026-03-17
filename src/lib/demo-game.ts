import { LiveTeam, RelayState, ScoreCard, ScoreMetricKey, TeamSeed } from "@/lib/game-types";

type RankComparableTeam = Pick<LiveTeam, "totalScore" | "scoreCard" | "submissionOrder">;

export const REFLECTION_MS = 5 * 60 * 1000;
export const RELAY_SLICE_MS = 2 * 60 * 1000;
export const RELAY_SLICES = 12;
export const TOTAL_GAME_MS = REFLECTION_MS + RELAY_SLICE_MS * RELAY_SLICES;

export const scoreLabels: Array<{ key: ScoreMetricKey; label: string; max: number }> = [
  { key: "correction", label: "Correction", max: 40 },
  { key: "edgeCases", label: "Edge Cases", max: 20 },
  { key: "complexity", label: "Complexite", max: 20 },
  { key: "readability", label: "Lisibilite", max: 10 },
  { key: "speedBonus", label: "Rapidite", max: 10 }
];

export const demoTeams: TeamSeed[] = [
  {
    id: "byte-breakers",
    name: "Byte Breakers",
    station: "PC-01",
    status: "coding",
    submittedAfterSlice: 7,
    members: [
      { id: "bb-a", name: "Lina", relayOrder: 1 },
      { id: "bb-b", name: "Matteo", relayOrder: 2 },
      { id: "bb-c", name: "Sarah", relayOrder: 3 }
    ],
    score: {
      correction: 35,
      edgeCases: 17,
      complexity: 18,
      readability: 9
    }
  },
  {
    id: "stack-smashers",
    name: "Stack Smashers",
    station: "PC-02",
    status: "coding",
    submittedAfterSlice: 8,
    members: [
      { id: "ss-a", name: "Noah", relayOrder: 1 },
      { id: "ss-b", name: "Aya", relayOrder: 2 },
      { id: "ss-c", name: "Jules", relayOrder: 3 }
    ],
    score: {
      correction: 38,
      edgeCases: 15,
      complexity: 16,
      readability: 7
    }
  },
  {
    id: "null-pointers",
    name: "Null Pointers",
    station: "PC-03",
    status: "ready",
    submittedAfterSlice: 10,
    members: [
      { id: "np-a", name: "Mila", relayOrder: 1 },
      { id: "np-b", name: "Enzo", relayOrder: 2 },
      { id: "np-c", name: "Rayan", relayOrder: 3 }
    ],
    score: {
      correction: 31,
      edgeCases: 14,
      complexity: 13,
      readability: 8
    }
  },
  {
    id: "complexity-crew",
    name: "Complexity Crew",
    station: "PC-04",
    status: "ready",
    submittedAfterSlice: undefined,
    members: [
      { id: "cc-a", name: "Ines", relayOrder: 1 },
      { id: "cc-b", name: "Leo", relayOrder: 2 },
      { id: "cc-c", name: "Nina", relayOrder: 3 }
    ],
    score: {
      correction: 26,
      edgeCases: 11,
      complexity: 12,
      readability: 6
    }
  }
];

export function getRelayState(now = Date.now()): RelayState {
  const elapsedMs = now % TOTAL_GAME_MS;

  if (elapsedMs < REFLECTION_MS) {
    return {
      phase: "reflection",
      elapsedMs,
      remainingMs: REFLECTION_MS - elapsedMs,
      totalMs: REFLECTION_MS,
      currentSlice: 0,
      activeRelayOrder: null,
      phaseLabel: "Phase de reflexion"
    };
  }

  const relayElapsedMs = elapsedMs - REFLECTION_MS;
  const currentSlice = Math.floor(relayElapsedMs / RELAY_SLICE_MS);

  return {
    phase: "relay",
    elapsedMs: relayElapsedMs,
    remainingMs: RELAY_SLICE_MS - (relayElapsedMs % RELAY_SLICE_MS),
    totalMs: RELAY_SLICES * RELAY_SLICE_MS,
    currentSlice,
    activeRelayOrder: (currentSlice % 3) + 1,
    phaseLabel: "Codage relais"
  };
}

function getSpeedBonus(order: number | null): number {
  if (order === 1) {
    return 10;
  }

  if (order === 2) {
    return 6;
  }

  if (order === 3) {
    return 3;
  }

  return 0;
}

function compareTeams(a: RankComparableTeam, b: RankComparableTeam): number {
  if (b.totalScore !== a.totalScore) {
    return b.totalScore - a.totalScore;
  }

  if (b.scoreCard.correction !== a.scoreCard.correction) {
    return b.scoreCard.correction - a.scoreCard.correction;
  }

  if (b.scoreCard.edgeCases !== a.scoreCard.edgeCases) {
    return b.scoreCard.edgeCases - a.scoreCard.edgeCases;
  }

  if (b.scoreCard.complexity !== a.scoreCard.complexity) {
    return b.scoreCard.complexity - a.scoreCard.complexity;
  }

  const aOrder = a.submissionOrder ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.submissionOrder ?? Number.MAX_SAFE_INTEGER;

  return aOrder - bOrder;
}

export function buildLiveTeams(seeds: TeamSeed[], state: RelayState): LiveTeam[] {
  type UnrankedLiveTeam = Omit<LiveTeam, "rank">;

  const submittedTeamIds = seeds
    .filter((team) => {
      if (team.submittedAt) {
        return true;
      }

      return team.submittedAfterSlice !== undefined && state.phase === "relay" && state.currentSlice >= team.submittedAfterSlice;
    })
    .sort((a, b) => {
      if (a.submittedAt && b.submittedAt) {
        return a.submittedAt.localeCompare(b.submittedAt);
      }

      if (a.submittedAt) {
        return -1;
      }

      if (b.submittedAt) {
        return 1;
      }

      return (a.submittedAfterSlice ?? Number.MAX_SAFE_INTEGER) - (b.submittedAfterSlice ?? Number.MAX_SAFE_INTEGER);
    })
    .map((team) => team.id);

  const liveTeams = seeds.map<UnrankedLiveTeam>((team) => {
    const submissionIndex = submittedTeamIds.indexOf(team.id);
    const submissionOrder = submissionIndex >= 0 ? submissionIndex + 1 : null;
    const activeMember =
      state.phase === "relay" && submissionOrder === null
        ? team.members.find((member) => member.relayOrder === state.activeRelayOrder) ?? null
        : null;
    const progress =
      submissionOrder !== null
        ? 100
        : state.phase === "reflection"
        ? Math.round((state.elapsedMs / REFLECTION_MS) * 100)
        : Math.min(
            100,
            Math.round(((state.currentSlice + 1) / RELAY_SLICES) * 100)
          );
    const speedBonus = getSpeedBonus(submissionOrder);
    const scoreCard: ScoreCard = {
      ...team.score,
      speedBonus
    };

    return {
      ...team,
      status:
        team.status === "scored"
          ? "scored"
          : submissionOrder !== null
          ? "submitted"
          : state.phase === "reflection"
            ? "ready"
            : "coding",
      activeMember,
      totalScore:
        scoreCard.correction +
        scoreCard.edgeCases +
        scoreCard.complexity +
        scoreCard.readability +
        scoreCard.speedBonus,
      progress,
      submissionOrder,
      scoreCard
    };
  });

  const rankedTeams = [...liveTeams].sort(compareTeams);

  return rankedTeams.map((team, index) => ({
    ...team,
    rank: index + 1
  }));
}

export function formatClock(ms: number): string {
  const safeMs = Math.max(ms, 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function getStatusLabel(status: LiveTeam["status"]): string {
  switch (status) {
    case "registered":
      return "Inscrite";
    case "ready":
      return "Prete";
    case "coding":
      return "En codage";
    case "submitted":
      return "Soumise";
    case "scored":
      return "Corrigee";
    default:
      return status;
  }
}
