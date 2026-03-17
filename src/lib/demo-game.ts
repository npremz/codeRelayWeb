import { LiveTeam, RelayState, RoundControlState, ScoreCard, ScoreMetricKey, TeamSeed } from "@/lib/game-types";

type RankComparableTeam = Pick<LiveTeam, "totalScore" | "scoreCard" | "submissionOrder">;

export const REFLECTION_MS = 5 * 60 * 1000;
export const RELAY_SLICE_MS = 2 * 60 * 1000;
export const RELAY_SLICES = 12;

export const defaultRoundState: RoundControlState = {
  registrationOpen: true,
  phase: "draft",
  previousPhase: null,
  phaseStartedAt: null,
  pausedElapsedMs: null,
  reflectionMs: REFLECTION_MS,
  relaySliceMs: RELAY_SLICE_MS,
  totalRelaySlices: RELAY_SLICES,
  updatedAt: ""
};

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

export function getRelayState(round: RoundControlState, now = Date.now()): RelayState {
  const reflectionMs = round.reflectionMs;
  const relayTotalMs = round.relaySliceMs * round.totalRelaySlices;

  if (round.phase === "draft") {
    return {
      phase: "draft",
      elapsedMs: 0,
      remainingMs: reflectionMs,
      totalMs: reflectionMs,
      currentSlice: 0,
      activeRelayOrder: null,
      phaseLabel: round.registrationOpen ? "Inscriptions ouvertes" : "Inscriptions fermees",
      progress: 0,
      isRunning: false
    };
  }

  if (round.phase === "complete") {
    return {
      phase: "complete",
      elapsedMs: relayTotalMs,
      remainingMs: 0,
      totalMs: relayTotalMs,
      currentSlice: Math.max(round.totalRelaySlices - 1, 0),
      activeRelayOrder: null,
      phaseLabel: "Manche terminee",
      progress: 100,
      isRunning: false
    };
  }

  const elapsedMs =
    round.phaseStartedAt && round.phase !== "paused"
      ? Math.max(0, now - new Date(round.phaseStartedAt).getTime())
      : round.pausedElapsedMs ?? 0;

  if (round.phase === "reflection" || (round.phase === "paused" && round.previousPhase === "reflection")) {
    const boundedElapsedMs = Math.min(elapsedMs, reflectionMs);

    return {
      phase: round.phase,
      elapsedMs: boundedElapsedMs,
      remainingMs: Math.max(reflectionMs - boundedElapsedMs, 0),
      totalMs: reflectionMs,
      currentSlice: 0,
      activeRelayOrder: null,
      phaseLabel: round.phase === "paused" ? "Pause pendant reflexion" : "Phase de reflexion",
      progress: reflectionMs === 0 ? 0 : Math.round((boundedElapsedMs / reflectionMs) * 100),
      isRunning: round.phase !== "paused"
    };
  }

  const boundedElapsedMs = Math.min(elapsedMs, relayTotalMs);
  const currentSlice = Math.min(
    Math.floor(boundedElapsedMs / round.relaySliceMs),
    Math.max(round.totalRelaySlices - 1, 0)
  );
  const sliceElapsedMs = boundedElapsedMs % round.relaySliceMs;

  return {
    phase: round.phase,
    elapsedMs: boundedElapsedMs,
    remainingMs: Math.max(round.relaySliceMs - sliceElapsedMs, 0),
    totalMs: relayTotalMs,
    currentSlice,
    activeRelayOrder: (currentSlice % 3) + 1,
    phaseLabel: round.phase === "paused" ? "Pause pendant relais" : "Codage relais",
    progress: relayTotalMs === 0 ? 0 : Math.round((boundedElapsedMs / relayTotalMs) * 100),
    isRunning: round.phase !== "paused"
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
      (state.phase === "relay" || (state.phase === "paused" && state.activeRelayOrder !== null)) && submissionOrder === null
        ? team.members.find((member) => member.relayOrder === state.activeRelayOrder) ?? null
        : null;
    const progress =
      submissionOrder !== null
        ? 100
        : state.phase === "draft"
          ? 0
          : state.phase === "complete"
            ? 100
            : state.progress;
    const speedBonus = getSpeedBonus(submissionOrder);
    const scoreCard: ScoreCard = {
      ...team.score,
      speedBonus
    };
    const computedStatus =
      team.status === "scored"
        ? "scored"
        : submissionOrder !== null
          ? "submitted"
          : state.phase === "draft" || state.phase === "complete"
            ? team.status
            : state.phase === "reflection" || (state.phase === "paused" && state.activeRelayOrder === null)
              ? "ready"
              : "coding";

    return {
      ...team,
      status: computedStatus,
      activeMember,
      totalScore:
        scoreCard.correction +
        scoreCard.edgeCases +
        scoreCard.complexity +
        scoreCard.readability +
        scoreCard.speedBonus,
      progress,
      submissionOrder,
      scoreCard,
      tieBreakNote: null
    };
  });

  const rankedTeams = [...liveTeams].sort(compareTeams);

  return rankedTeams.map((team, index, allTeams) => {
    const previousTeam = allTeams[index - 1];
    let tieBreakNote: string | null = null;

    if (previousTeam && previousTeam.totalScore === team.totalScore) {
      if (previousTeam.scoreCard.correction !== team.scoreCard.correction) {
        tieBreakNote = "Departage sur correction";
      } else if (previousTeam.scoreCard.edgeCases !== team.scoreCard.edgeCases) {
        tieBreakNote = "Departage sur edge cases";
      } else if (previousTeam.scoreCard.complexity !== team.scoreCard.complexity) {
        tieBreakNote = "Departage sur complexite";
      } else if (previousTeam.submissionOrder !== team.submissionOrder) {
        tieBreakNote = "Departage sur ordre de soumission";
      }
    }

    return {
      ...team,
      rank: index + 1,
      tieBreakNote
    };
  });
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

export function getRoundActionLabel(phase: RoundControlState["phase"]): string {
  switch (phase) {
    case "draft":
      return "Attente";
    case "reflection":
      return "Reflexion";
    case "relay":
      return "Relais";
    case "paused":
      return "Pause";
    case "complete":
      return "Terminee";
    default:
      return phase;
  }
}

export function formatTieBreakTuple(team: Pick<LiveTeam, "scoreCard" | "submissionOrder">): string {
  const submissionLabel = team.submissionOrder ? `S${team.submissionOrder}` : "S-";

  return `C${team.scoreCard.correction} · E${team.scoreCard.edgeCases} · X${team.scoreCard.complexity} · ${submissionLabel}`;
}

export function getTieBreakReason(team: Pick<LiveTeam, "tieBreakNote">): string {
  return team.tieBreakNote ?? "Aucun departage necessaire";
}

export function getTieBreakScenarios(teams: LiveTeam[]) {
  const scenarios: Array<{
    leadingTeam: LiveTeam;
    trailingTeam: LiveTeam;
    reason: string;
  }> = [];

  for (let index = 1; index < teams.length; index += 1) {
    const currentTeam = teams[index];
    const previousTeam = teams[index - 1];

    if (currentTeam.totalScore === previousTeam.totalScore && currentTeam.tieBreakNote) {
      scenarios.push({
        leadingTeam: previousTeam,
        trailingTeam: currentTeam,
        reason: currentTeam.tieBreakNote
      });
    }
  }

  return scenarios;
}
