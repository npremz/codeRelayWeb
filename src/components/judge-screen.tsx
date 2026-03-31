"use client";

import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { buildLiveTeams, formatTieBreakTuple, getRelayState, scoreLabels } from "@/lib/demo-game";
import { PublicTeam, ScoreCard, ScoreMetricKey, TeamScoreInput } from "@/lib/game-types";
import { useLiveTeams } from "@/lib/use-live-teams";
import { ChangeEvent, useEffect, useState } from "react";
import { Scale } from "lucide-react";

type JudgeScores = Record<string, ScoreCard>;

function buildInitialScores(
  teams: PublicTeam[],
  speedBonusByTeamId: Map<string, number>
): JudgeScores {
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

type JudgeScreenProps = {
  staffRole: "admin" | "judge";
};

const criterionColors: Record<string, string> = {
  correction: "text-hot",
  edgeCases: "text-cyan",
  complexity: "text-accent-light",
  readability: "text-success"
};

const criterionBarColors: Record<string, string> = {
  correction: "bg-hot",
  edgeCases: "bg-cyan",
  complexity: "bg-accent",
  readability: "bg-success"
};

export function JudgeScreen({ staffRole }: JudgeScreenProps) {
  const [now, setNow] = useState(0);
  const { teams, round, currentRound, usingDemoData, refresh, connected } = useLiveTeams();
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [scores, setScores] = useState<JudgeScores>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const editableCriteria = scoreLabels.filter((criterion) => criterion.key !== "speedBonus");

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const liveTeams = buildLiveTeams(teams, getRelayState(round, now));
  const liveTeamsMap = new Map(liveTeams.map((team) => [team.id, team]));
  const speedBonusByTeamId = new Map(liveTeams.map((team) => [team.id, team.scoreCard.speedBonus]));

  useEffect(() => {
    if (teams.length === 0) {
      return;
    }

    const freshScores = buildInitialScores(teams, speedBonusByTeamId);
    setScores((current) => ({
      ...freshScores,
      ...current
    }));
    setSelectedTeamId((current) => (teams.some((team) => team.id === current) ? current : teams[0].id));
  }, [teams, now, round]);

  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? teams[0];

  if (!selectedTeam) {
    return (
      <AppFrame
        title="Notation"
        subtitle="Cockpit de notation du jury"
        currentRound={currentRound}
        navigation="staff"
        staffRole={staffRole}
      >
        <Panel accent="warn" eyebrow="File d'attente" title="Aucune équipe">
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 text-text-faint/40"><Scale size={48} strokeWidth={1} /></div>
            <p className="text-base text-text-muted">Aucune équipe disponible pour correction.</p>
          </div>
        </Panel>
      </AppFrame>
    );
  }

  const selectedSpeedBonus = speedBonusByTeamId.get(selectedTeam.id) ?? 0;
  const selectedScore = scores[selectedTeam.id] ?? {
    ...selectedTeam.score,
    speedBonus: selectedSpeedBonus,
    notes: selectedTeam.score.notes ?? ""
  };

  const total =
    selectedScore.correction +
    selectedScore.edgeCases +
    selectedScore.complexity +
    selectedScore.readability +
    selectedSpeedBonus;

  function updateScore(key: keyof ScoreCard, value: number | string) {
    setScores((current) => ({
      ...current,
      [selectedTeam.id]: {
        ...current[selectedTeam.id],
        [key]: value
      }
    }));
  }

  function handleNumericChange(key: ScoreMetricKey, max: number) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Math.max(0, Math.min(max, Number(event.target.value) || 0));
      updateScore(key, nextValue);
    };
  }

  async function handleSave() {
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
        throw new Error(data.error ?? "Impossible d'enregistrer la note.");
      }

      await refresh();
      setMessage("Évaluation enregistrée.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'enregistrer la note.");
    } finally {
      setSaving(false);
    }
  }

  const isError = message.includes("Impossible");

  return (
    <AppFrame
      title="Notation"
      subtitle="Cockpit de notation du jury"
      currentRound={currentRound}
      navigation="staff"
      staffRole={staffRole}
    >
      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        {/* ── Left column: Session + Team selector ──── */}
        <div className="space-y-6">
          <Panel accent="accent" eyebrow="Session" title="Contexte">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Rôle</span>
                <span className="rounded-lg border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-light">
                  {staffRole}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Flux live</span>
                <span className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${connected ? "bg-success animate-pulse-glow" : "bg-hot"}`} />
                  <span className={`text-sm ${connected ? "text-success" : "text-hot"}`}>
                    {connected ? "SSE actif" : "Reconnexion..."}
                  </span>
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-sm text-text-muted">Sujet</span>
                <div className="min-w-0 max-w-[70%] text-right">
                  <p className="break-safe text-sm font-semibold text-text">
                    {currentRound?.subject?.title ?? "Non assigné"}
                  </p>
                  <p className="break-safe text-xs text-text-faint">
                    {currentRound?.subject?.fileName ?? "Aucun fichier défini"}
                  </p>
                </div>
              </div>
              {usingDemoData && (
                <div className="rounded-xl border border-warn/20 bg-warn/5 px-4 py-3 text-sm text-warn">
                  Mode démo actif — les notes ne seront pas reliées à de vraies équipes.
                </div>
              )}
            </div>
          </Panel>

          <Panel eyebrow="File d'attente" title="Équipes à évaluer">
            <p className="mb-4 text-sm text-text-muted">
              {teams.length} équipe(s) chargée(s) · Sélectionner pour noter
            </p>
            <div className="space-y-2.5">
              {teams.map((team) => {
                const teamScore = scores[team.id];
                if (!teamScore) return null;

                const teamTotal =
                  teamScore.correction +
                  teamScore.edgeCases +
                  teamScore.complexity +
                  teamScore.readability +
                  (speedBonusByTeamId.get(team.id) ?? teamScore.speedBonus);
                const isSelected = selectedTeam.id === team.id;

                return (
                  <button
                    key={team.id}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-accent/40 bg-accent/10"
                        : "border-border bg-elevated/30 hover:border-border-hover hover:bg-elevated/50"
                    }`}
                    onClick={() => setSelectedTeamId(team.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`font-display text-base font-bold tracking-tight truncate ${isSelected ? "text-accent-light" : "text-text"}`}>
                          {team.name}
                        </p>
                        <p className="mt-0.5 text-xs text-text-faint">
                          {team.station} · {team.teamCode}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-display text-2xl font-bold ${isSelected ? "text-accent-light" : "text-text"}`}>
                          {teamTotal}
                        </p>
                        <p className="text-xs text-text-faint">/ 100</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* ── Right column: Scoring form ──────────── */}
        <div className="space-y-6">
          <Panel accent="warn" eyebrow="Évaluation" title={selectedTeam.name}>
            <div className="grid gap-6 lg:grid-cols-[1fr_0.38fr]">
              {/* Scoring inputs */}
              <div className="space-y-5">
                {editableCriteria.map((criterion) => (
                  <label key={criterion.key} className="block">
                    <div className="mb-2.5 flex items-center justify-between gap-4">
                      <span className={`text-xs font-bold uppercase tracking-wider ${criterionColors[criterion.key] ?? "text-text-muted"}`}>
                        {criterion.label}
                      </span>
                      <span className="text-xs text-text-faint">/ {criterion.max}</span>
                    </div>
                    <div className="relative">
                      <input
                        className="signal-input pr-16"
                        max={criterion.max}
                        min={0}
                        type="number"
                        value={selectedScore[criterion.key] ?? 0}
                        onChange={handleNumericChange(criterion.key, criterion.max)}
                      />
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-elevated">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${criterionBarColors[criterion.key] ?? "bg-accent"}`}
                            style={{ width: `${((selectedScore[criterion.key] ?? 0) / criterion.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </label>
                ))}

                {/* Speed bonus (read-only) */}
                <div className="rounded-xl border border-warn/20 bg-warn/5 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-warn">Rapidité</span>
                    <span className="text-xs text-text-faint">Automatique</span>
                  </div>
                  <p className="mt-2 font-display text-3xl font-bold text-warn">{selectedSpeedBonus}</p>
                </div>

                {/* Notes */}
                <label className="block">
                  <span className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-text-muted">
                    Notes du jury
                  </span>
                  <textarea
                    className="signal-input min-h-32 resize-y"
                    value={selectedScore.notes ?? ""}
                    onChange={(event) => updateScore("notes", event.target.value)}
                    placeholder="Observations sur la correction, les cas limites ou la clarté du code."
                  />
                </label>

                {/* Feedback message */}
                {message && (
                  <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                    isError
                      ? "border-hot/20 bg-hot/5 text-hot"
                      : "border-success/20 bg-success/5 text-success"
                  }`}>
                    <span className={`inline-block h-2 w-2 rounded-full ${isError ? "bg-hot" : "bg-success"}`} />
                    {message}
                  </div>
                )}

                {/* Save button */}
                <button
                  className="signal-button w-full"
                  onClick={handleSave}
                  type="button"
                  disabled={saving || usingDemoData}
                >
                  {saving ? "Enregistrement..." : usingDemoData ? "Mode démo" : "Enregistrer l'évaluation"}
                </button>
              </div>

              {/* Score summary sidebar */}
              <div className="space-y-5">
                {/* Total score card */}
                <div className="rounded-2xl border border-accent/25 bg-accent/5 p-5 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent-light">Total</p>
                  <p className="mt-2 font-display text-6xl font-bold tracking-tight text-text">{total}</p>
                  <p className="mt-2 text-sm text-text-faint">/ 100</p>
                </div>

                {/* Tie-break tuple */}
                <div className="rounded-xl border border-border bg-elevated/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-faint">Départage</p>
                  <p className="mt-2 font-mono text-sm text-text-muted">
                    {formatTieBreakTuple(liveTeamsMap.get(selectedTeam.id) ?? { scoreCard: selectedScore, submissionOrder: selectedTeam.submittedAt ? 0 : null })}
                  </p>
                </div>

                {/* Tie-break note */}
                {liveTeamsMap.get(selectedTeam.id)?.tieBreakNote && (
                  <div className="rounded-xl border border-warn/20 bg-warn/5 p-4 text-sm text-warn">
                    {liveTeamsMap.get(selectedTeam.id)?.tieBreakNote}
                  </div>
                )}

                {/* Submission status */}
                <div className={`rounded-xl border p-4 text-sm ${
                  selectedTeam.submittedAt
                    ? "border-success/20 bg-success/5 text-success"
                    : "border-border bg-elevated/50 text-text-faint"
                }`}>
                  {selectedTeam.submittedAt
                    ? `Soumise le ${new Date(selectedTeam.submittedAt).toLocaleString("fr-BE")}`
                    : "Soumission non marquée"}
                </div>

                {/* Team members */}
                <div className="space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-faint">Composition</p>
                  {selectedTeam.members.map((member) => (
                    <div key={member.id} className="rounded-lg border border-border bg-surface px-3 py-3">
                      <p className={`text-xs font-bold uppercase tracking-wider ${
                        member.relayOrder === 1 ? "text-hot" :
                        member.relayOrder === 2 ? "text-cyan" :
                        member.relayOrder === 3 ? "text-accent-light" :
                        "text-success"
                      }`}>
                        Relais {member.relayOrder}
                      </p>
                      <p className="mt-1 text-sm text-text">{member.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* Official rubric */}
          <Panel accent="cyan" eyebrow="Barème" title="Guide officiel">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-hot/20 bg-hot/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-hot">Correction / 40</p>
                <p className="mt-2 text-sm text-text-muted">Vérifier la validité globale, la compilation et le comportement sur les cas simples.</p>
              </div>
              <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan">Edge Cases / 20</p>
                <p className="mt-2 text-sm text-text-muted">Entrées vides, tailles minimales, doublons, valeurs négatives, cas impossibles.</p>
              </div>
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-accent-light">Complexité / 20</p>
                <p className="mt-2 text-sm text-text-muted">Approche générale, absence de hardcode et complexité cohérente avec le sujet.</p>
              </div>
              <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-success">Lisibilité / 10</p>
                <p className="mt-2 text-sm text-text-muted">Noms clairs, structure propre, relais facile entre coéquipiers.</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
