"use client";

import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { StaffStatusHeader } from "@/components/staff-status-header";
import { buildLiveTeams, formatTieBreakTuple, getRelayState, scoreLabels } from "@/lib/demo-game";
import { PublicTeam, ScoreCard, TeamScoreInput } from "@/lib/game-types";
import { useLiveTeams } from "@/lib/use-live-teams";
import { Search, Scale, StickyNote, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type JudgeScores = Record<string, ScoreCard>;
type QueueFilter = "pending" | "scored" | "all";
type MobileTab = "queue" | "score";
type StoredDraft = Pick<ScoreCard, "correction" | "edgeCases" | "complexity" | "readability" | "notes">;

type JudgeScreenProps = {
  staffRole: "admin" | "judge";
  initialTeamCode?: string | null;
};

const DRAFT_STORAGE_KEY = "code-relay-judge-drafts";

const criterionColors: Record<string, string> = {
  correction: "text-hot",
  edgeCases: "text-cyan",
  complexity: "text-accent-light",
  readability: "text-success"
};

const criterionCardColors: Record<string, string> = {
  correction: "border-hot/20 bg-hot/5",
  edgeCases: "border-cyan/20 bg-cyan/5",
  complexity: "border-accent/20 bg-accent/5",
  readability: "border-success/20 bg-success/5"
};

function buildInitialScores(teams: PublicTeam[], speedBonusByTeamId: Map<string, number>): JudgeScores {
  return Object.fromEntries(
    teams.map((team) => [
      team.id,
      {
        ...team.score,
        speedBonus: speedBonusByTeamId.get(team.id) ?? 0,
        notes: team.score.notes ?? ""
      }
    ])
  );
}

function queuePriority(team: ReturnType<typeof buildLiveTeams>[number]) {
  if (team.status === "submitted") {
    return 0;
  }

  if (team.status === "coding") {
    return 1;
  }

  if (team.status === "ready") {
    return 2;
  }

  if (team.status === "registered") {
    return 3;
  }

  return 4;
}

function getStationOrder(station: string) {
  const match = station.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function matchesQueueFilter(team: ReturnType<typeof buildLiveTeams>[number], filter: QueueFilter) {
  switch (filter) {
    case "pending":
      return team.status === "submitted";
    case "scored":
      return team.status === "scored";
    case "all":
    default:
      return true;
  }
}

function loadDraftsFromStorage() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);

    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as Record<string, StoredDraft>;
  } catch {
    return {};
  }
}

function ScoreStepper({
  label,
  value,
  max,
  tint,
  onChange
}: {
  label: string;
  value: number;
  max: number;
  tint: string;
  onChange: (nextValue: number) => void;
}) {
  return (
    <div className={`rounded-[1.6rem] border px-4 py-4 ${criterionCardColors[tint] ?? "border-border bg-elevated/20"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${criterionColors[tint] ?? "text-text-muted"}`}>
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-text">
            {value}
            <span className="ml-1 text-base text-text-faint">/ {max}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="ghost-button !min-h-[44px] !w-[44px] !px-0"
            onClick={() => onChange(Math.max(0, value - 1))}
            type="button"
          >
            -
          </button>
          <button
            className="signal-button !min-h-[44px] !w-[44px] !bg-surface !px-0 !text-text ring-1 ring-border hover:!bg-elevated"
            onClick={() => onChange(Math.min(max, value + 1))}
            type="button"
          >
            +
          </button>
        </div>
      </div>
      <input
        className="signal-input mt-4"
        max={max}
        min={0}
        onChange={(event) => onChange(Math.max(0, Math.min(max, Number(event.target.value) || 0)))}
        type="number"
        value={value}
      />
    </div>
  );
}

export function JudgeScreen({ staffRole, initialTeamCode }: JudgeScreenProps) {
  const [now, setNow] = useState(0);
  const { teams, round, currentRound, usingDemoData, refresh, connected } = useLiveTeams();
  const [mobileTab, setMobileTab] = useState<MobileTab>("queue");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("pending");
  const [queueSearch, setQueueSearch] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [scores, setScores] = useState<JudgeScores>({});
  const [drafts, setDrafts] = useState<Record<string, StoredDraft>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [hasAppliedInitialTeam, setHasAppliedInitialTeam] = useState(false);

  const editableCriteria = scoreLabels.filter((criterion) => criterion.key !== "speedBonus");

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setDrafts(loadDraftsFromStorage());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts]);

  const relayState = useMemo(() => getRelayState(round, now), [round, now]);
  const liveTeams = useMemo(() => buildLiveTeams(teams, relayState), [relayState, teams]);
  const liveTeamsMap = useMemo(() => new Map(liveTeams.map((team) => [team.id, team])), [liveTeams]);
  const teamMap = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const speedBonusByTeamId = useMemo(
    () => new Map(liveTeams.map((team) => [team.id, team.scoreCard.speedBonus])),
    [liveTeams]
  );
  const baseScores = useMemo(() => buildInitialScores(teams, speedBonusByTeamId), [speedBonusByTeamId, teams]);
  const sortedQueue = useMemo(
    () =>
      [...liveTeams].sort((left, right) => {
        const priorityDiff = queuePriority(left) - queuePriority(right);

        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        const stationDiff = getStationOrder(left.station) - getStationOrder(right.station);

        if (stationDiff !== 0) {
          return stationDiff;
        }

        return left.name.localeCompare(right.name, "fr");
      }),
    [liveTeams]
  );

  const visibleQueue = useMemo(() => {
    const search = queueSearch.trim().toLowerCase();

    return sortedQueue.filter((team) => {
      if (!matchesQueueFilter(team, queueFilter)) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [team.name, team.teamCode ?? "", team.station, ...team.members.map((member) => member.name)]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [queueFilter, queueSearch, sortedQueue]);

  useEffect(() => {
    setScores((current) => {
      const nextScores = { ...baseScores };

      Object.entries(drafts).forEach(([teamId, draft]) => {
        if (!nextScores[teamId]) {
          return;
        }

        nextScores[teamId] = {
          ...nextScores[teamId],
          ...draft,
          speedBonus: speedBonusByTeamId.get(teamId) ?? nextScores[teamId].speedBonus
        };
      });

      Object.entries(current).forEach(([teamId, score]) => {
        if (!nextScores[teamId]) {
          return;
        }

        nextScores[teamId] = {
          ...nextScores[teamId],
          ...score,
          speedBonus: speedBonusByTeamId.get(teamId) ?? nextScores[teamId].speedBonus
        };
      });

      return nextScores;
    });
  }, [baseScores, drafts, speedBonusByTeamId]);

  useEffect(() => {
    setHasAppliedInitialTeam(false);
  }, [initialTeamCode]);

  useEffect(() => {
    if (sortedQueue.length === 0) {
      setSelectedTeamId("");
      return;
    }

    const preferredTeam =
      !hasAppliedInitialTeam && initialTeamCode
        ? sortedQueue.find((team) => team.teamCode?.toUpperCase() === initialTeamCode.toUpperCase())
        : null;

    setSelectedTeamId((current) => {
      if (preferredTeam) {
        return preferredTeam.id;
      }

      if (sortedQueue.some((team) => team.id === current)) {
        return current;
      }

      return sortedQueue[0].id;
    });

    if (preferredTeam) {
      setMobileTab("score");
      setHasAppliedInitialTeam(true);
    }
  }, [hasAppliedInitialTeam, initialTeamCode, sortedQueue]);

  const selectedLiveTeam = liveTeamsMap.get(selectedTeamId) ?? sortedQueue[0];
  const selectedTeam = selectedLiveTeam ? teamMap.get(selectedLiveTeam.id) ?? null : null;
  const selectedScore = selectedTeam ? scores[selectedTeam.id] : null;
  const isError = message.includes("Impossible") || message.includes("impossible");

  function removeDraft(teamId: string) {
    setDrafts((current) => {
      if (!(teamId in current)) {
        return current;
      }

      const next = { ...current };
      delete next[teamId];
      return next;
    });
  }

  function syncDraft(teamId: string, nextScore: ScoreCard) {
    const baseScore = baseScores[teamId];

    if (!baseScore) {
      return;
    }

    const nextDraft: StoredDraft = {
      correction: nextScore.correction,
      edgeCases: nextScore.edgeCases,
      complexity: nextScore.complexity,
      readability: nextScore.readability,
      notes: nextScore.notes ?? ""
    };

    const matchesBase =
      nextDraft.correction === baseScore.correction &&
      nextDraft.edgeCases === baseScore.edgeCases &&
      nextDraft.complexity === baseScore.complexity &&
      nextDraft.readability === baseScore.readability &&
      nextDraft.notes === (baseScore.notes ?? "");

    if (matchesBase) {
      removeDraft(teamId);
      return;
    }

    setDrafts((current) => ({
      ...current,
      [teamId]: nextDraft
    }));
  }

  function updateScoreForTeam(teamId: string, updater: (current: ScoreCard) => ScoreCard) {
    setScores((current) => {
      const currentScore = current[teamId] ?? baseScores[teamId];

      if (!currentScore) {
        return current;
      }

      const nextScore = updater(currentScore);
      syncDraft(teamId, nextScore);

      return {
        ...current,
        [teamId]: nextScore
      };
    });
  }

  async function handleSave() {
    if (!selectedTeam || !selectedScore) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload: TeamScoreInput = {
        correction: selectedScore.correction,
        edgeCases: selectedScore.edgeCases,
        complexity: selectedScore.complexity,
        readability: selectedScore.readability,
        notes: selectedScore.notes
      };

      const response = await fetch(`/api/teams/${selectedTeam.teamCode}/score`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Impossible d’enregistrer la note.");
      }

      removeDraft(selectedTeam.id);
      await refresh();
      setMessage("Évaluation enregistrée.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d’enregistrer la note.");
    } finally {
      setSaving(false);
    }
  }

  if (!selectedLiveTeam || !selectedTeam || !selectedScore) {
    return (
      <AppFrame
        title="Notation"
        subtitle="Cockpit de notation du jury"
        currentRound={currentRound}
        navigation="staff"
        staffRole={staffRole}
      >
        <StaffStatusHeader
          currentRound={currentRound}
          relayState={relayState}
          registrationOpen={round.registrationOpen}
          connected={connected}
          teams={liveTeams}
        />
        <Panel accent="warn" eyebrow="File" title="Aucune équipe">
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 text-text-faint/40">
              <Scale size={48} strokeWidth={1} />
            </div>
            <p className="text-base text-text-muted">Aucune équipe disponible pour correction.</p>
          </div>
        </Panel>
      </AppFrame>
    );
  }

  const selectedSpeedBonus = speedBonusByTeamId.get(selectedTeam.id) ?? 0;
  const total =
    selectedScore.correction +
    selectedScore.edgeCases +
    selectedScore.complexity +
    selectedScore.readability +
    selectedSpeedBonus;
  const activeTeam = selectedTeam;
  const activeLiveTeam = selectedLiveTeam;
  const activeScore = selectedScore;

  function renderQueueSection() {
    return (
      <Panel accent="accent" eyebrow="File" title="Équipes à évaluer">
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
              <input
                className="signal-input pl-11"
                onChange={(event) => setQueueSearch(event.target.value)}
                placeholder="Rechercher par nom, code, station ou membre"
                value={queueSearch}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "pending" as const, label: "À corriger" },
                { id: "scored" as const, label: "Corrigées" },
                { id: "all" as const, label: "Toutes" }
              ].map((filter) => (
                <button
                  key={filter.id}
                  className="segment-button"
                  data-active={queueFilter === filter.id}
                  onClick={() => setQueueFilter(filter.id)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-elevated/30 px-4 py-3 text-sm text-text-muted">
            {visibleQueue.length} équipe(s) visibles · la file priorise les soumissions à corriger
          </div>

          {usingDemoData && (
            <div className="rounded-2xl border border-warn/20 bg-warn/5 px-4 py-3 text-sm text-warn">
              Mode démo actif — les notes ne sont pas reliées à de vraies équipes.
            </div>
          )}

          {visibleQueue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-elevated/20 px-5 py-10 text-center text-sm text-text-muted">
              Aucune équipe ne correspond à ce filtre.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleQueue.map((team) => {
                const isSelected = selectedLiveTeam.id === team.id;
                const teamScore = scores[team.id] ?? baseScores[team.id];
                const teamTotal =
                  teamScore.correction +
                  teamScore.edgeCases +
                  teamScore.complexity +
                  teamScore.readability +
                  (speedBonusByTeamId.get(team.id) ?? teamScore.speedBonus);
                const hasDraft = team.id in drafts;

                return (
                  <button
                    key={team.id}
                    className={`w-full rounded-[1.6rem] border px-4 py-4 text-left transition-all ${
                      isSelected
                        ? "border-accent/30 bg-accent/10"
                        : "border-border bg-surface hover:border-border-hover hover:bg-elevated/20"
                    }`}
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setMobileTab("score");
                    }}
                    type="button"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="surface-chip text-accent-light">{team.station}</span>
                          <span className="surface-chip text-text-faint">{team.teamCode}</span>
                          {hasDraft && (
                            <span className="surface-chip text-warn">
                              Brouillon local
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 break-safe font-display text-xl font-bold tracking-tight text-text">
                          {team.name}
                        </h3>
                        <p className="mt-2 text-sm text-text-muted">
                          {team.status === "submitted" ? "Prête à corriger" : team.status === "scored" ? "Déjà corrigée" : "Encore en cours"}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className={`font-display text-4xl font-bold tracking-tight ${isSelected ? "text-accent-light" : "text-text"}`}>
                          {teamTotal}
                        </p>
                        <p className="mt-1 text-sm text-text-faint">
                          {formatTieBreakTuple(team)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Panel>
    );
  }

  function renderScoreSection() {
    const hasDraft = activeTeam.id in drafts;

    return (
      <div className="space-y-6">
        <Panel accent="warn" eyebrow="Notation" title={activeTeam.name}>
          <div className="space-y-5">
            <div className="rounded-[1.6rem] border border-accent/20 bg-accent/5 px-5 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="surface-chip text-accent-light">{activeTeam.station}</span>
                    <span className="surface-chip text-text-faint">{activeTeam.teamCode}</span>
                    {hasDraft && <span className="surface-chip text-warn">Brouillon non enregistré</span>}
                  </div>
                  <p className="mt-3 text-sm text-text-muted">
                    {activeLiveTeam.submittedAt ? "Soumission marquée" : "Soumission non marquée"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-surface px-4 py-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-light">Total</p>
                  <p className="mt-2 font-display text-5xl font-bold tracking-tight text-text">{total}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {editableCriteria.map((criterion) => (
                <ScoreStepper
                  key={criterion.key}
                  label={criterion.label}
                  max={criterion.max}
                  onChange={(nextValue) =>
                    updateScoreForTeam(activeTeam.id, (current) => ({
                      ...current,
                      [criterion.key]: nextValue
                    }))
                  }
                  tint={criterion.key}
                  value={activeScore[criterion.key]}
                />
              ))}
            </div>

            <div className="rounded-[1.6rem] border border-warn/20 bg-warn/5 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-warn">Rapidité</p>
                  <p className="mt-2 font-display text-4xl font-bold tracking-tight text-text">{selectedSpeedBonus}</p>
                </div>
                {hasDraft && (
                  <button
                    className="ghost-button"
                    onClick={() => {
                      removeDraft(activeTeam.id);
                      setScores((current) => ({
                        ...current,
                        [activeTeam.id]: baseScores[activeTeam.id]
                      }));
                    }}
                    type="button"
                  >
                    <Undo2 size={16} />
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            <details className="group rounded-[1.6rem] border border-border bg-surface px-5 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-elevated p-3 text-accent-light">
                    <StickyNote size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-light">Notes</p>
                    <p className="text-sm text-text-muted">Section secondaire pour les observations du jury.</p>
                  </div>
                </div>
                <span className="text-text-faint transition-transform group-open:rotate-180">⌃</span>
              </summary>
              <textarea
                className="signal-input mt-4 min-h-32 resize-y"
                onChange={(event) =>
                  updateScoreForTeam(activeTeam.id, (current) => ({
                    ...current,
                    notes: event.target.value
                  }))
                }
                placeholder="Observations sur la correction, les cas limites ou la clarté du code."
                value={activeScore.notes ?? ""}
              />
            </details>

            {message && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  isError
                    ? "border-hot/20 bg-hot/5 text-hot"
                    : "border-success/20 bg-success/5 text-success"
                }`}
              >
                {message}
              </div>
            )}

            <div className="hidden lg:block">
              <button
                className="signal-button w-full"
                disabled={saving || usingDemoData}
                onClick={() => void handleSave()}
                type="button"
              >
                {saving ? "Enregistrement..." : usingDemoData ? "Mode démo" : "Enregistrer l’évaluation"}
              </button>
            </div>
          </div>
        </Panel>

        <Panel accent="cyan" eyebrow="Contexte" title="Aide de correction">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-elevated/20 px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-faint">Départage</p>
              <p className="mt-2 font-mono text-sm text-text-muted">
                {formatTieBreakTuple(activeLiveTeam)}
              </p>
              {activeLiveTeam.tieBreakNote && (
                <p className="mt-2 text-sm text-warn">{activeLiveTeam.tieBreakNote}</p>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-elevated/20 px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-faint">Composition</p>
              <div className="mt-3 space-y-2">
                {activeTeam.members.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-border bg-surface px-3 py-3 text-sm text-text">
                    Relais {member.relayOrder} · {member.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <AppFrame
      title="Notation"
      subtitle="Cockpit de notation du jury"
      currentRound={currentRound}
      navigation="staff"
      staffRole={staffRole}
    >
      <div className="sticky top-0 z-20 -mx-1 mb-4 grid grid-cols-2 gap-2 bg-void/92 px-1 py-2 backdrop-blur-xl lg:hidden">
        {[
          { id: "queue" as const, label: "File" },
          { id: "score" as const, label: "Notation" }
        ].map((tab) => (
          <button
            key={tab.id}
            className="segment-button min-w-0"
            data-active={mobileTab === tab.id}
            onClick={() => setMobileTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <StaffStatusHeader
        currentRound={currentRound}
        relayState={relayState}
        registrationOpen={round.registrationOpen}
        connected={connected}
        teams={liveTeams}
      />

      <div className="space-y-6 lg:hidden">
        {mobileTab === "queue" && renderQueueSection()}
        {mobileTab === "score" && renderScoreSection()}
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-[0.78fr_1.22fr]">
        <div>{renderQueueSection()}</div>
        <div>{renderScoreSection()}</div>
      </div>

      <div className={`fixed inset-x-4 bottom-24 z-40 lg:hidden ${mobileTab === "score" ? "" : "hidden"}`}>
        <div className="rounded-[1.6rem] border border-border bg-surface/95 px-4 py-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold tracking-tight text-text">{activeTeam.name}</p>
              <p className="text-sm text-text-faint">
                {activeLiveTeam.submittedAt ? "Soumission marquée" : "Soumission non marquée"} · {total}/100
              </p>
            </div>
            <button
              className="signal-button shrink-0"
              disabled={saving || usingDemoData}
              onClick={() => void handleSave()}
              type="button"
            >
              {saving ? "..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
