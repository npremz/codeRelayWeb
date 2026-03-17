"use client";

import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { PhaseTimer } from "@/components/phase-timer";
import { buildLiveTeams, getRelayState, getStatusLabel } from "@/lib/demo-game";
import { useLiveTeams } from "@/lib/use-live-teams";
import { useEffect, useState } from "react";

type AdminScreenProps = {
  staffRole: "admin" | "judge";
};

export function AdminScreen({ staffRole }: AdminScreenProps) {
  const [now, setNow] = useState(0);
  const { teams: storedTeams, usingDemoData } = useLiveTeams();

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const relayState = getRelayState(now);
  const teams = buildLiveTeams(storedTeams, relayState);

  return (
    <AppFrame
      title="Organizer"
      subtitle="Admin board for the game master. The MVP shows the round state, station supervision and the operational reminders needed to enforce the rules."
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-6">
          <Panel eyebrow="Session" title="Staff Context">
            <p className="text-sm text-fog">
              Role actif: <span className="text-sand">{staffRole}</span>. Cette surface est protegee par code staff.
            </p>
          </Panel>
          <PhaseTimer state={relayState} />
          <Panel eyebrow="Round Controls" title="Operator Actions">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Open registration",
                "Start reflection",
                "Launch relay",
                "Pause round",
                "Mark submission",
                "Close round"
              ].map((action) => (
                <button key={action} className="ghost-button text-left">
                  {action}
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-fog">
              In the final backend version, these buttons will mutate the round state and broadcast updates to TV and judge screens.
            </p>
            <p className="mt-2 text-sm text-fog">
              Source actuelle: {usingDemoData ? "jeu de demonstration" : `${storedTeams.length} equipe(s) stockee(s)`}.
            </p>
          </Panel>
        </div>

        <div className="grid gap-6">
          <Panel eyebrow="Stations" title="Team Monitoring">
            <div className="grid gap-4">
              {teams.map((team) => (
                <article key={team.id} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-fog">
                        {team.station} · {team.teamCode ?? "NO-CODE"}
                      </p>
                      <h3 className="font-display text-4xl uppercase">{team.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.18em] text-fog">
                        {getStatusLabel(team.status)}
                      </span>
                      <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-signal">
                        {team.activeMember ? `Clavier: ${team.activeMember.name}` : "Aucun joueur actif"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className={`rounded-[1.2rem] border p-4 ${
                          team.activeMember?.id === member.id
                            ? "border-lime/30 bg-lime/10 text-lime"
                            : "border-white/10 bg-black/20 text-sand"
                        }`}
                      >
                        <p className="text-xs uppercase tracking-[0.18em] text-fog">Relay {member.relayOrder}</p>
                        <p className="mt-2 text-base">{member.name}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Referee Notes" title="Rules Enforcement">
            <ul className="space-y-3 text-sm text-fog">
              <li>Verifier le silence total autour du joueur au clavier pendant son tour.</li>
              <li>La rotation ne peut jamais etre sautee, meme si un joueur pense aller plus vite.</li>
              <li>Les notes papier preparees pendant les 5 minutes sont autorisees, rien d'autre.</li>
              <li>Le bonus vitesse est assigne automatiquement a la soumission officielle.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
