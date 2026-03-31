export type ResumeRoundPhase = "reflection" | "relay";

export type RoundPhase = "draft" | ResumeRoundPhase | "paused" | "complete";

export type TeamStatus = "registered" | "ready" | "coding" | "submitted" | "scored";

export const MIN_TEAM_MEMBERS = 2;
export const MAX_TEAM_MEMBERS = 4;
export const RELAY_SEAT_LABELS = ["A", "B", "C", "D"] as const;

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

export type SubjectParameter = {
  name: string;
  type: string;
  description: string;
};

export type SubjectReturn = {
  type: string;
  description: string;
};

export type SubjectExample = {
  title: string;
  input: Record<string, unknown>;
  output: unknown;
  explanation?: string;
};

export type RoundSubject = {
  id: string;
  title: string;
  fileName: string;
  brief: string;
  functionName: string;
  prototype?: string;
  difficulty?: "easy" | "medium" | "hard";
  parameters: SubjectParameter[];
  returns?: SubjectReturn;
  constraints: string[];
  examples: SubjectExample[];
};

export type RoundSummary = {
  id: string;
  sequence: number;
  name: string;
  isCurrent: boolean;
  subject: RoundSubject | null;
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
  subjectId?: string | null;
};

export type AdminSelectRoundInput = {
  roundId: string;
};

export type AdminAssignSubjectInput = {
  roundId?: string;
  subjectId?: string | null;
};

export type AdminResetEventInput = {
  confirmationText: string;
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
