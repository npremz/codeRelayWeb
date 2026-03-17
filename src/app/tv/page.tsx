"use client";

import { buildLiveTeams, formatClock, getRelayState } from "@/lib/demo-game";
import { useLiveTeams } from "@/lib/use-live-teams";
import { useEffect, useState } from "react";

export default function TvPage() {
  const [now, setNow] = useState(0);
  const { teams: storedTeams, round } = useLiveTeams();

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const relayState = getRelayState(round, now);
  const teams = buildLiveTeams(storedTeams, relayState);
  const leader = teams[0];

  return (
    <main className="grain relative min-h-screen overflow-hidden bg-obsidian px-6 py-6 text-sand md:px-10 md:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,122,36,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(202,255,76,0.14),transparent_30%)]" />
      <div className="relative grid min-h-[calc(100vh-3rem)] gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2.5rem] border border-white/10 bg-black/25 p-6 shadow-glow backdrop-blur md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <p className="tracking-[0.45em] text-signal">CODE RELAY</p>
              <h1 className="mt-3 font-display text-[5.4rem] uppercase leading-none md:text-[9rem]">
                {relayState.phaseLabel}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.24em] text-fog">Temps restant</p>
              <p className="font-display text-[5rem] leading-none text-lime md:text-[8rem]">
                {formatClock(relayState.remainingMs)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-lime/20 bg-lime/10 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-lime">Leader actuel</p>
              {leader ? (
                <>
                  <h2 className="mt-3 font-display text-6xl uppercase leading-none text-sand md:text-7xl">
                    {leader.name}
                  </h2>
                  <p className="mt-2 text-sm uppercase tracking-[0.18em] text-fog">
                    {leader.station} · {leader.teamCode ?? "NO-CODE"}
                  </p>
                  <p className="mt-8 font-display text-[5rem] leading-none text-lime">{leader.totalScore}</p>
                  <p className="mt-2 text-sm text-fog">
                    {leader.submissionOrder ? `Soumission #${leader.submissionOrder}` : "Toujours en course"}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-fog">Donnees live du tournoi</p>
                </>
              ) : (
                <>
                  <h2 className="mt-3 font-display text-6xl uppercase leading-none text-sand md:text-7xl">En attente</h2>
                  <p className="mt-2 text-sm uppercase tracking-[0.18em] text-fog">Aucune equipe classee</p>
                  <p className="mt-8 text-sm text-fog">Le mur TV affichera le classement des que les equipes seront inscrites.</p>
                </>
              )}
            </div>

            <div className="grid gap-4">
              {teams.slice(0, 3).map((team) => (
                <article
                  key={team.id}
                  className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <span className="font-display text-5xl text-signal">{team.rank}</span>
                      <div>
                        <p className="font-display text-4xl uppercase leading-none">{team.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-fog">
                          {team.station} · {team.teamCode ?? "NO-CODE"}
                        </p>
                      </div>
                    </div>
                    <p className="font-display text-6xl">{team.totalScore}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em]">
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-fog">
                      {team.activeMember ? `Clavier: ${team.activeMember.name}` : "Pas de joueur actif"}
                    </span>
                    <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-2 text-signal">
                      {team.submissionOrder ? `Soumise #${team.submissionOrder}` : "Score provisoire"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-white/10 bg-black/25 p-6 shadow-glow backdrop-blur md:p-8">
          <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-fog">Wallboard</p>
              <h2 className="mt-2 font-display text-6xl uppercase leading-none md:text-7xl">Teams</h2>
            </div>
            <p className="max-w-xs text-right text-sm text-fog">
              5 min de reflexion, puis relais de 2 min sans communication avec le joueur au clavier.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {teams.length === 0 && <p className="text-sm text-fog">Aucune equipe inscrite pour le moment.</p>}
            {teams.map((team) => (
              <article key={team.id} className="rounded-[1.7rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-4xl uppercase leading-none">{team.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-fog">
                      {team.teamCode ?? "NO-CODE"} · {team.members.map((member) => member.name).join(" / ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-5xl leading-none">{team.totalScore}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-fog">Score live</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-signal" style={{ width: `${team.progress}%` }} />
                  </div>
                  <span className="rounded-full border border-lime/30 bg-lime/10 px-3 py-2 text-xs uppercase tracking-[0.16em] text-lime">
                    {team.activeMember ? `Au clavier: ${team.activeMember.name}` : "En attente"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
