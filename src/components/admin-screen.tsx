"use client";

import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { PhaseTimer } from "@/components/phase-timer";
import { AdminRoundAction } from "@/lib/game-types";
import { buildLiveTeams, getRelayState, getRoundActionLabel, getStatusLabel } from "@/lib/demo-game";
import { useLiveTeams } from "@/lib/use-live-teams";
import { useEffect, useState } from "react";

type AdminScreenProps = {
  staffRole: "admin" | "judge";
};

export function AdminScreen({ staffRole }: AdminScreenProps) {
  const [now, setNow] = useState(0);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { teams: storedTeams, round, refresh, connected } = useLiveTeams();

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const relayState = getRelayState(round, now);
  const teams = buildLiveTeams(storedTeams, relayState);

  const actions: Array<{ id: AdminRoundAction; label: string }> = [
    { id: "open_registration", label: "Open Registration" },
    { id: "close_registration", label: "Close Registration" },
    { id: "start_reflection", label: "Start Reflection" },
    { id: "start_relay", label: "Start Relay" },
    { id: "pause_round", label: "Pause Round" },
    { id: "resume_round", label: "Resume Round" },
    { id: "close_round", label: "Close Round" }
  ];

  async function runRoundAction(action: AdminRoundAction) {
    setBusyAction(action);
    setMessage("");

    try {
      const response = await fetch("/api/admin/round", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Action admin impossible.");
      }

      await refresh();
      setMessage("Etat de manche mis a jour.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action admin impossible.");
    } finally {
      setBusyAction(null);
    }
  }

  async function markSubmitted(teamCode: string) {
    setBusyAction(teamCode);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/submissions/${teamCode}`, {
        method: "POST"
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible de marquer la soumission.");
      }

      await refresh();
      setMessage("Soumission enregistree.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de marquer la soumission.");
    } finally {
      setBusyAction(null);
    }
  }

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
            <p className="mt-2 text-sm text-fog">
              Phase: <span className="text-sand">{getRoundActionLabel(round.phase)}</span> · Inscriptions{" "}
              <span className="text-sand">{round.registrationOpen ? "ouvertes" : "fermees"}</span>
            </p>
          </Panel>
          <PhaseTimer state={relayState} />
          <Panel eyebrow="Round Controls" title="Operator Actions">
            <div className="grid gap-3 md:grid-cols-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  className="ghost-button text-left"
                  disabled={busyAction !== null}
                  onClick={() => runRoundAction(action.id)}
                  type="button"
                >
                  {busyAction === action.id ? "Processing..." : action.label}
                </button>
              ))}
            </div>
            {message && (
              <p className={`mt-4 text-sm ${message.includes("impossible") || message.includes("requise") ? "text-signal" : "text-lime"}`}>
                {message}
              </p>
            )}
            <p className="mt-2 text-sm text-fog">
              Flux live: <span className={connected ? "text-lime" : "text-signal"}>{connected ? "SSE actif" : "reconnexion"}</span>
            </p>
            <p className="mt-2 text-sm text-fog">
              {storedTeams.length} equipe(s) stockee(s) dans le tournoi.
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
                      <button
                        className="ghost-button px-4 py-2 text-xs"
                        disabled={team.submissionOrder !== null || busyAction !== null}
                        onClick={() => markSubmitted(team.teamCode ?? "")}
                        type="button"
                      >
                        {busyAction === team.teamCode ? "Processing..." : team.submissionOrder !== null ? `Soumise #${team.submissionOrder}` : "Mark Submission"}
                      </button>
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
              <li>Le bonus vitesse est assigne automatiquement a l'ordre reel de soumission.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
