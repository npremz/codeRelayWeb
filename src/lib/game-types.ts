export type ResumeRoundPhase = "reflection" | "relay";

export type RoundPhase = "draft" | ResumeRoundPhase | "paused" | "complete";

export type TeamStatus = "registered" | "ready" | "coding" | "submitted" | "scored";

export type TeamMember = {
  id: string;
  name: string;
  relayOrder: number;
};

export type ScoreCard = {
  correction: number;
  edgeCases: number;
  complexity: number;
  readability: number;
  speedBonus: number;
  notes?: string;
};

export type ScoreMetricKey =
  | "correction"
  | "edgeCases"
  | "complexity"
  | "readability"
  | "speedBonus";

export type TeamSeed = {
  id: string;
  teamCode?: string;
  name: string;
  station: string;
  members: TeamMember[];
  status: TeamStatus;
  submittedAfterSlice?: number;
  submittedAt?: string | null;
  score: Omit<ScoreCard, "speedBonus">;
};

export type PublicTeam = TeamSeed & {
  teamCode: string;
  createdAt: string;
  updatedAt: string;
  locked: boolean;
};

export type LiveTeam = TeamSeed & {
  activeMember: TeamMember | null;
  totalScore: number;
  progress: number;
  rank: number;
  submissionOrder: number | null;
  scoreCard: ScoreCard;
  tieBreakNote: string | null;
};

export type RoundControlState = {
  registrationOpen: boolean;
  phase: RoundPhase;
  previousPhase: ResumeRoundPhase | null;
  phaseStartedAt: string | null;
  pausedElapsedMs: number | null;
  reflectionMs: number;
  relaySliceMs: number;
  totalRelaySlices: number;
  updatedAt: string;
};

export type RoundSummary = {
  id: string;
  sequence: number;
  name: string;
  isCurrent: boolean;
  registrationOpen: boolean;
  phase: RoundPhase;
  teamCount: number;
  createdAt: string;
  updatedAt: string;
};

export type RelayState = {
  phase: RoundPhase;
  elapsedMs: number;
  remainingMs: number;
  totalMs: number;
  currentSlice: number;
  activeRelayOrder: number | null;
  phaseLabel: string;
  progress: number;
  isRunning: boolean;
};

export type TeamCreateInput = {
  name: string;
  members: string[];
};

export type TeamUpdateInput = TeamCreateInput & {
  token: string;
};

export type TeamScoreInput = {
  correction: number;
  edgeCases: number;
  complexity: number;
  readability: number;
  notes?: string;
};

export type TeamCreateResponse = {
  team: PublicTeam;
  editToken: string;
  managePath: string;
};

export type AdminCreateRoundInput = {
  name?: string;
  cloneTeams?: boolean;
  teamCodes?: string[];
  makeCurrent?: boolean;
};

export type AdminSelectRoundInput = {
  roundId: string;
};

export type LiveTeamsResponse = {
  teams: PublicTeam[];
  round: RoundControlState;
  currentRound: RoundSummary | null;
  rounds: RoundSummary[];
  usingDemoData: boolean;
};

export type AdminRoundAction =
  | "open_registration"
  | "close_registration"
  | "start_reflection"
  | "start_relay"
  | "pause_round"
  | "resume_round"
  | "close_round";
