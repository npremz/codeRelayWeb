"use client";

import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { buildLiveTeams, formatTieBreakTuple, getRelayState, scoreLabels } from "@/lib/demo-game";
import { PublicTeam, ScoreCard, ScoreMetricKey, TeamScoreInput } from "@/lib/game-types";
import { useLiveTeams } from "@/lib/use-live-teams";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

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

export function JudgeScreen({ staffRole }: JudgeScreenProps) {
  const [now, setNow] = useState(0);
  const { teams, round, usingDemoData, refresh } = useLiveTeams();
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
        title="Judge"
        subtitle="Judge cockpit aligned with the official rubric. Create a team first or keep the store live."
      >
        <Panel eyebrow="Queue" title="No Teams">
          <p className="text-sm text-fog">Aucune equipe disponible pour correction.</p>
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

  const total = useMemo(
    () =>
      selectedScore.correction +
      selectedScore.edgeCases +
      selectedScore.complexity +
      selectedScore.readability +
      selectedSpeedBonus,
    [selectedScore, selectedSpeedBonus]
  );

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
      setMessage("Evaluation enregistree.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible d'enregistrer la note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppFrame
      title="Judge"
      subtitle="Judge cockpit aligned with the official rubric. Each team is evaluated on correction, edge cases, complexity, readability and speed bonus, with a computed total out of 100."
    >
      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <Panel eyebrow="Session" title="Staff Context">
          <p className="text-sm text-fog">
            Role actif: <span className="text-sand">{staffRole}</span>. L'API de scoring exige une session staff valide.
          </p>
        </Panel>
        <Panel eyebrow="Queue" title="Teams To Review">
          <p className="mb-4 text-sm text-fog">
            {usingDemoData
              ? "Mode demo actif. Les notes ne seront pas reliees a de vraies equipes."
              : `${teams.length} equipe(s) chargee(s) depuis le store local.`}
          </p>
          <div className="grid gap-3">
            {teams.map((team) => {
              const teamScore = scores[team.id];
              if (!teamScore) {
                return null;
              }

              const teamTotal =
                teamScore.correction +
                teamScore.edgeCases +
                teamScore.complexity +
                teamScore.readability +
                (speedBonusByTeamId.get(team.id) ?? teamScore.speedBonus);

              return (
                <button
                  key={team.id}
                  className={`rounded-[1.5rem] border p-4 text-left transition ${
                    selectedTeam.id === team.id
                      ? "border-signal/50 bg-signal/10"
                      : "border-white/10 bg-white/5 hover:border-lime/40"
                  }`}
                  onClick={() => setSelectedTeamId(team.id)}
                  type="button"
                >
                  <p className="font-display text-3xl uppercase">{team.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-fog">
                    {team.station} · {team.teamCode}
                  </p>
                  <p className="mt-4 text-sm text-fog">Score actuel: {teamTotal} / 100</p>
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="grid gap-6 xl:col-span-1">
          <Panel eyebrow="Evaluation" title={selectedTeam.name}>
            <div className="grid gap-6 md:grid-cols-[1fr_0.36fr]">
              <div className="grid gap-4">
                {editableCriteria.map((criterion) => (
                  <label key={criterion.key} className="block">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="text-xs uppercase tracking-[0.2em] text-fog">{criterion.label}</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-fog">/ {criterion.max}</span>
                    </div>
                    <input
                      className="signal-input"
                      max={criterion.max}
                      min={0}
                      type="number"
                      value={selectedScore[criterion.key] ?? 0}
                      onChange={handleNumericChange(criterion.key, criterion.max)}
                    />
                  </label>
                ))}
                <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs uppercase tracking-[0.2em] text-fog">Rapidite</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-fog">Auto</span>
                  </div>
                  <p className="mt-2 text-2xl text-sand">{selectedSpeedBonus}</p>
                </div>
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-fog">Notes jury</span>
                  <textarea
                    className="signal-input min-h-36"
                    value={selectedScore.notes ?? ""}
                    onChange={(event) => updateScore("notes", event.target.value)}
                    placeholder="Observations sur la correction, les cas limites ou la clarte du code."
                  />
                </label>
                {message && (
                  <p className={`text-sm ${message.includes("Impossible") ? "text-signal" : "text-lime"}`}>
                    {message}
                  </p>
                )}
                <button className="signal-button" onClick={handleSave} type="button" disabled={saving || usingDemoData}>
                  {saving ? "Saving..." : usingDemoData ? "Demo Mode" : "Save Score"}
                </button>
              </div>

              <div className="rounded-[1.8rem] border border-lime/20 bg-lime/10 p-5 text-lime">
                <p className="text-xs uppercase tracking-[0.22em]">Total</p>
                <p className="stat-value mt-3 text-lime">{total}</p>
                <p className="mt-2 text-sm">
                  Departage: correction, puis edge cases, puis complexite, puis ordre de soumission.
                </p>
                <div className="mt-4 rounded-[1.1rem] border border-lime/20 bg-black/15 p-3 text-sm">
                  Tie-break: {formatTieBreakTuple(liveTeamsMap.get(selectedTeam.id) ?? { scoreCard: selectedScore, submissionOrder: selectedTeam.submittedAt ? 0 : null })}
                </div>
                {liveTeamsMap.get(selectedTeam.id)?.tieBreakNote && (
                  <div className="mt-3 rounded-[1.1rem] border border-signal/30 bg-signal/10 p-3 text-sm text-signal">
                    {liveTeamsMap.get(selectedTeam.id)?.tieBreakNote}
                  </div>
                )}
                <div className="mt-4 rounded-[1.1rem] border border-lime/20 bg-black/15 p-3 text-sm">
                  {selectedTeam.submittedAt
                    ? `Soumise le ${new Date(selectedTeam.submittedAt).toLocaleString("fr-BE")}`
                    : "Soumission non marquee par l'organisateur"}
                </div>
                <div className="mt-6 grid gap-3 text-sm">
                  {selectedTeam.members.map((member) => (
                    <div key={member.id} className="rounded-[1.1rem] border border-lime/20 bg-black/15 p-3">
                      Relay {member.relayOrder}: {member.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Rubric" title="Official Guidance">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-fog">
                <p className="text-xs uppercase tracking-[0.2em] text-signal">Correction / 40</p>
                <p className="mt-2">Verifier la validite globale, la compilation et le comportement sur les cas simples.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-fog">
                <p className="text-xs uppercase tracking-[0.2em] text-signal">Edge Cases / 20</p>
                <p className="mt-2">Entrees vides, tailles minimales, doublons, valeurs negatives, cas impossibles.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-fog">
                <p className="text-xs uppercase tracking-[0.2em] text-signal">Complexite / 20</p>
                <p className="mt-2">Approche generale, absence de hardcode et complexite coherente avec le sujet.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-fog">
                <p className="text-xs uppercase tracking-[0.2em] text-signal">Lisibilite / 10</p>
                <p className="mt-2">Noms clairs, structure propre, relais facile entre coequipiers.</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
