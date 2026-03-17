"use client";

import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { RankingTable } from "@/components/ranking-table";
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
  const { teams: storedTeams, round } = useLiveTeams();

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
      title="Results"
      subtitle="Public ranking page for teams and audience. It exposes the applied tie-break logic so equal totals remain explainable and transparent."
    >
      <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
        <div className="grid gap-6">
          <Panel eyebrow="Public Board" title={isFinal ? "Classement Final" : "Classement Provisoire"}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-fog">Phase</p>
                <p className="mt-2 font-display text-4xl uppercase">{getRoundActionLabel(round.phase)}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-fog">Equipes</p>
                <p className="mt-2 font-display text-4xl uppercase">{teams.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-fog">Statut</p>
                <p className="mt-2 font-display text-4xl uppercase">{isFinal ? "Fige" : "Live"}</p>
              </div>
            </div>
          </Panel>

          <RankingTable teams={teams} eyebrow="Ranking" title={isFinal ? "Classement Officiel" : "Classement En Cours"} />
        </div>

        <div className="grid gap-6">
          <Panel eyebrow="Tie-Break" title="Why One Team Leads">
            <p className="text-sm text-fog">
              Ordre officiel de departage: correction, edge cases, complexite, puis ordre de soumission.
            </p>
            <div className="mt-5 grid gap-4">
              {tieBreakScenarios.length === 0 && (
                <p className="text-sm text-fog">Aucun departage actif pour le moment. Chaque equipe a un total distinct.</p>
              )}
              {tieBreakScenarios.map((scenario) => (
                <article key={`${scenario.leadingTeam.id}-${scenario.trailingTeam.id}`} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <p className="font-display text-3xl uppercase">
                    {scenario.leadingTeam.rank}. {scenario.leadingTeam.name}
                  </p>
                  <p className="mt-1 text-sm text-fog">
                    devant {scenario.trailingTeam.rank}. {scenario.trailingTeam.name}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-signal">{scenario.reason}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-fog">
                    {scenario.leadingTeam.name}: {formatTieBreakTuple(scenario.leadingTeam)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-fog">
                    {scenario.trailingTeam.name}: {formatTieBreakTuple(scenario.trailingTeam)}
                  </p>
                </article>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Legend" title="Read The Tuple">
            <ul className="space-y-3 text-sm text-fog">
              <li>`C` = note de correction sur 40.</li>
              <li>`E` = note edge cases sur 20.</li>
              <li>`X` = note complexite sur 20.</li>
              <li>`S` = ordre de soumission, plus petit = meilleur.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
