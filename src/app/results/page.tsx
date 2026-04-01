"use client";

import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { RankingTable } from "@/components/ranking-table";
import { Trophy, BarChart2, Scale } from "lucide-react";
import {
  buildLiveTeams,
  formatTieBreakTuple,
  getRelayState,
  getRoundActionLabel,
  getTieBreakScenarios
} from "@/lib/demo-game";
import { useLiveTeams } from "@/lib/use-live-teams";
import { useEffect, useState } from "react";

export default function ResultsPage() {
  const [now, setNow] = useState(0);
  const { teams: storedTeams, round, currentRound } = useLiveTeams();

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const relayState = getRelayState(round, now);
  const teams = buildLiveTeams(storedTeams, relayState);
  const tieBreakScenarios = getTieBreakScenarios(teams);
  const isFinal = round.phase === "complete";

  return (
    <AppFrame
      title="Résultats"
      subtitle="Classement public du tournoi"
      currentRound={currentRound}
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* ── Left column: Ranking ─────────────────────── */}
        <div className="space-y-6">
          {/* Status header banner */}
          <div className={`rounded-2xl border p-6 ${
            isFinal ? "border-success/25 bg-success/5" : "border-accent/20 bg-accent/5"
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                  isFinal ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
                }`}>
                  {isFinal ? <Trophy size={28} /> : <BarChart2 size={28} />}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-text">
                    {isFinal ? "Classement Final" : "Classement Provisoire"}
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    {isFinal
                      ? "Résultats définitifs sur score cumulé"
                      : "Les scores cumulés peuvent encore évoluer"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="rounded-xl border border-border bg-surface px-4 md:px-5 py-3 text-center flex-1 sm:flex-none">
                  <p className="font-display text-lg md:text-xl font-bold text-text">{getRoundActionLabel(round.phase)}</p>
                  <p className="mt-0.5 text-[10px] md:text-xs uppercase tracking-wider text-text-faint">Phase</p>
                </div>
                <div className="rounded-xl border border-border bg-surface px-4 md:px-5 py-3 text-center flex-1 sm:flex-none">
                  <p className="font-display text-lg md:text-xl font-bold text-text">{teams.length}</p>
                  <p className="mt-0.5 text-[10px] md:text-xs uppercase tracking-wider text-text-faint">Équipes</p>
                </div>
                <div className="rounded-xl border border-border bg-surface px-4 md:px-5 py-3 text-center flex-1 sm:flex-none">
                  <p className={`font-display text-lg md:text-xl font-bold ${isFinal ? "text-success" : "text-accent-light"}`}>
                    {isFinal ? "Figé" : "Live"}
                  </p>
                  <p className="mt-0.5 text-[10px] md:text-xs uppercase tracking-wider text-text-faint">Statut</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking table */}
          <RankingTable
            teams={teams}
            eyebrow="Leaderboard"
            title={isFinal ? "Classement Officiel" : "Classement en cours"}
          />
        </div>

        {/* ── Right column: Tie-break + Legend ──────────── */}
        <div className="space-y-6">
          <Panel accent="warn" eyebrow="Départage" title="Explication du classement">
            <p className="text-sm leading-relaxed text-text-muted">
              Le classement est cumulé entre les manches. En cas d'égalité au total, le départage se fait sur la
              manche courante : correction, edge cases, complexité, puis ordre de soumission.
            </p>

            <div className="mt-5 space-y-4">
              {tieBreakScenarios.length === 0 && (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="mb-3 text-text-faint/40"><Scale size={48} strokeWidth={1} /></div>
                  <p className="text-sm text-text-muted">Aucun départage actif. Chaque équipe a un total distinct.</p>
                </div>
              )}
              {tieBreakScenarios.map((scenario) => (
                <article
                  key={`${scenario.leadingTeam.id}-${scenario.trailingTeam.id}`}
                  className="rounded-xl border border-border bg-elevated/30 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold tracking-tight text-text truncate">
                        {scenario.leadingTeam.rank}. {scenario.leadingTeam.name}
                      </p>
                      <p className="mt-1 text-sm text-text-faint">
                        devant {scenario.trailingTeam.rank}. {scenario.trailingTeam.name}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg border border-warn/15 bg-warn/5 px-4 py-3 text-sm font-semibold text-warn">
                    {scenario.reason}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <p className="font-mono text-sm text-text-muted">
                      {scenario.leadingTeam.name}: {formatTieBreakTuple(scenario.leadingTeam)}
                    </p>
                    <p className="font-mono text-sm text-text-faint">
                      {scenario.trailingTeam.name}: {formatTieBreakTuple(scenario.trailingTeam)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel accent="cyan" eyebrow="Légende" title="Lire le tuple de départage">
            <div className="grid gap-3">
              <div className="flex items-center gap-4 rounded-lg border border-accent/20 bg-accent/5 px-5 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono text-sm font-bold text-accent-light">T</span>
                <span className="text-sm text-text-muted">Le score affiché est le total cumulé sur toutes les manches jouées</span>
              </div>
              <div className="flex items-center gap-4 rounded-lg border border-border bg-elevated/50 px-5 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hot/10 font-mono text-sm font-bold text-hot">C</span>
                <span className="text-sm text-text-muted">Note de correction sur 40</span>
              </div>
              <div className="flex items-center gap-4 rounded-lg border border-border bg-elevated/50 px-5 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan/10 font-mono text-sm font-bold text-cyan">E</span>
                <span className="text-sm text-text-muted">Note edge cases sur 20</span>
              </div>
              <div className="flex items-center gap-4 rounded-lg border border-border bg-elevated/50 px-5 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-mono text-sm font-bold text-accent-light">X</span>
                <span className="text-sm text-text-muted">Note complexité sur 20</span>
              </div>
              <div className="flex items-center gap-4 rounded-lg border border-border bg-elevated/50 px-5 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warn/10 font-mono text-sm font-bold text-warn">S</span>
                <span className="text-sm text-text-muted">Ordre de soumission (plus petit = meilleur)</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
