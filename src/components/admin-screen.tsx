"use client";

import { AppFrame } from "@/components/app-frame";
import { LiveNotificationBanner } from "@/components/live-notification-banner";
import { Panel } from "@/components/panel";
import { PhaseTimer } from "@/components/phase-timer";
import { AdminRoundAction, RoundSummary } from "@/lib/game-types";
import { buildLiveTeams, getRelayState, getRoundActionLabel, getStatusLabel } from "@/lib/demo-game";
import { useRoundNotifications } from "@/lib/use-round-notifications";
import { useLiveTeams } from "@/lib/use-live-teams";
import { useEffect, useState } from "react";
import { FileEdit, Lock, MessageCircle, Zap, Pause, Play, Flag, Radio } from "lucide-react";

type AdminScreenProps = {
  staffRole: "admin" | "judge";
};

const actionConfig: Record<AdminRoundAction, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  open_registration: { label: "Ouvrir inscriptions", icon: <FileEdit size={20} />, color: "text-success", desc: "Permettre aux équipes de s'inscrire" },
  close_registration: { label: "Fermer inscriptions", icon: <Lock size={20} />, color: "text-warn", desc: "Bloquer les nouvelles inscriptions" },
  start_reflection: { label: "Lancer réflexion", icon: <MessageCircle size={20} />, color: "text-cyan", desc: "Démarrer les 5 min de discussion" },
  start_relay: { label: "Lancer relais", icon: <Zap size={20} />, color: "text-hot", desc: "Démarrer les tours de codage" },
  pause_round: { label: "Pause", icon: <Pause size={20} />, color: "text-warn", desc: "Geler le chronomètre" },
  resume_round: { label: "Reprendre", icon: <Play size={20} />, color: "text-success", desc: "Relancer le chronomètre" },
  close_round: { label: "Clôturer manche", icon: <Flag size={20} />, color: "text-accent-light", desc: "Terminer la manche en cours" }
};

export function AdminScreen({ staffRole }: AdminScreenProps) {
  const [now, setNow] = useState(0);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { teams: storedTeams, round, currentRound, rounds, refresh, connected } = useLiveTeams();

  /* ── Round creation state ───────────────── */
  const [showCreateRound, setShowCreateRound] = useState(false);
  const [newRoundName, setNewRoundName] = useState("");
  const [cloneTeams, setCloneTeams] = useState(false);
  const [makeCurrent, setMakeCurrent] = useState(true);
  const [creatingRound, setCreatingRound] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const relayState = getRelayState(round, now);
  const notification = useRoundNotifications(relayState);
  const teams = buildLiveTeams(storedTeams, relayState);

  const actions: AdminRoundAction[] = [
    "open_registration",
    "close_registration",
    "start_reflection",
    "start_relay",
    "pause_round",
    "resume_round",
    "close_round"
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
      setMessage("État de manche mis à jour.");
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
      setMessage("Soumission enregistrée.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de marquer la soumission.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateRound() {
    setCreatingRound(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_round",
          name: newRoundName.trim() || undefined,
          cloneTeams,
          makeCurrent
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible de créer la manche.");
      }

      await refresh();
      setMessage("Nouvelle manche créée.");
      setShowCreateRound(false);
      setNewRoundName("");
      setCloneTeams(false);
      setMakeCurrent(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de créer la manche.");
    } finally {
      setCreatingRound(false);
    }
  }

  async function handleSwitchRound(roundId: string) {
    setBusyAction(`switch-${roundId}`);
    setMessage("");

    try {
      const response = await fetch("/api/admin/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "select_round",
          roundId
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible de changer de manche.");
      }

      await refresh();
      setMessage("Manche active changée.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de changer de manche.");
    } finally {
      setBusyAction(null);
    }
  }

  const isError = message.includes("impossible") || message.includes("requise") || message.includes("Impossible");

  function getRoundPhaseLabel(r: RoundSummary) {
    return getRoundActionLabel(r.phase);
  }

  return (
    <AppFrame
      title="Pilotage"
      subtitle="Tableau de bord organisateur"
      currentRound={currentRound}
    >
      <LiveNotificationBanner notification={notification} />

      {/* Feedback toast */}
      {message && (
        <div className={`mb-6 flex items-center gap-3 rounded-xl border px-5 py-3.5 text-sm animate-fade-in ${
          isError
            ? "border-hot/20 bg-hot/5 text-hot"
            : "border-success/20 bg-success/5 text-success"
        }`}>
          <span className={`inline-block h-2 w-2 rounded-full ${isError ? "bg-hot" : "bg-success"}`} />
          {message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        {/* ════════════════════════════════════════════ */}
        {/* LEFT COLUMN                                  */}
        {/* ════════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* ── Round management ──────────────────────── */}
          <Panel accent="accent" eyebrow="Manches" title="Gestion des manches">
            {/* Current round info */}
            {currentRound && (
              <div className="mb-5 rounded-xl border border-accent/20 bg-accent/5 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-accent-light">Manche active</p>
                    <p className="mt-1 font-display text-xl font-bold tracking-tight text-text">
                      {currentRound.name || `Manche ${currentRound.sequence}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-bold text-accent-light">{currentRound.teamCount}</p>
                    <p className="text-xs text-text-faint">équipes</p>
                  </div>
                </div>
              </div>
            )}

            {/* Round list */}
            {rounds.length > 0 && (
              <div className="mb-5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-text-faint">Toutes les manches</p>
                {rounds.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                      r.isCurrent
                        ? "border-accent/30 bg-accent/8"
                        : "border-border bg-elevated/30 hover:border-border-hover"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {r.isCurrent && (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent animate-pulse-glow" />
                      )}
                      <div>
                        <p className={`text-sm font-bold ${r.isCurrent ? "text-accent-light" : "text-text"}`}>
                          {r.name || `Manche ${r.sequence}`}
                        </p>
                        <p className="text-xs text-text-faint">
                          {getRoundPhaseLabel(r)} · {r.teamCount} équipes
                        </p>
                      </div>
                    </div>
                    {!r.isCurrent && (
                      <button
                        className="rounded-lg border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-light transition-all hover:bg-accent/20 disabled:opacity-40"
                        onClick={() => handleSwitchRound(r.id)}
                        disabled={busyAction !== null}
                        type="button"
                      >
                        {busyAction === `switch-${r.id}` ? "..." : "Activer"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Create new round */}
            {!showCreateRound ? (
              <button
                className="ghost-button w-full"
                onClick={() => setShowCreateRound(true)}
                type="button"
              >
                + Créer une nouvelle manche
              </button>
            ) : (
              <div className="space-y-4 rounded-xl border border-border bg-elevated/30 p-5">
                <p className="text-sm font-bold text-text">Nouvelle manche</p>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-faint">
                    Nom (optionnel)
                  </span>
                  <input
                    className="signal-input"
                    value={newRoundName}
                    onChange={(e) => setNewRoundName(e.target.value)}
                    placeholder="Ex: Demi-finale"
                  />
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloneTeams}
                    onChange={(e) => setCloneTeams(e.target.checked)}
                    className="h-5 w-5 rounded border-border bg-elevated accent-accent"
                  />
                  <span className="text-sm text-text-muted">Cloner les équipes de la manche actuelle</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={makeCurrent}
                    onChange={(e) => setMakeCurrent(e.target.checked)}
                    className="h-5 w-5 rounded border-border bg-elevated accent-accent"
                  />
                  <span className="text-sm text-text-muted">Rendre active immédiatement</span>
                </label>
                <div className="flex gap-3">
                  <button
                    className="signal-button flex-1 relative"
                    onClick={handleCreateRound}
                    disabled={creatingRound}
                    type="button"
                  >
                    {creatingRound && (
                      <svg className="absolute left-4 h-5 w-5 animate-spin text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <span>{creatingRound ? "Création..." : "Créer la manche"}</span>
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => setShowCreateRound(false)}
                    type="button"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </Panel>

          {/* ── Session context ───────────────────────── */}
          <Panel eyebrow="Session" title="Contexte">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Rôle actif</span>
                <span className="rounded-lg border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-light">
                  {staffRole}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Phase</span>
                <span className="text-sm font-semibold text-text">{getRoundActionLabel(round.phase)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Inscriptions</span>
                <span className={`text-sm font-semibold ${round.registrationOpen ? "text-success" : "text-hot"}`}>
                  {round.registrationOpen ? "Ouvertes" : "Fermées"}
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
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Équipes</span>
                <span className="font-display text-xl font-bold text-text">{storedTeams.length}</span>
              </div>
            </div>
          </Panel>

          {/* ── Phase timer ───────────────────────────── */}
          <PhaseTimer state={relayState} />

          {/* ── Round controls ────────────────────────── */}
          <Panel accent="hot" eyebrow="Commandes" title="Actions opérateur">
            <div className="grid gap-3 sm:grid-cols-2">
              {actions.map((action) => {
                const config = actionConfig[action];
                return (
                  <button
                    key={action}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-elevated/50 px-4 py-4 text-left transition-all hover:border-border-hover hover:bg-elevated disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={busyAction !== null}
                    onClick={() => runRoundAction(action)}
                    type="button"
                  >
                    <span className="text-xl">{config.icon}</span>
                    <div>
                      <span className={`text-sm font-bold ${config.color}`}>
                        {busyAction === action ? "..." : config.label}
                      </span>
                      <p className="mt-0.5 text-xs text-text-faint">{config.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* ── Referee notes ─────────────────────────── */}
          <Panel accent="warn" eyebrow="Arbitrage" title="Rappels réglementaires">
            <ul className="space-y-3 text-sm text-text-muted">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-warn font-bold">!</span>
                Vérifier le silence total autour du joueur au clavier pendant son tour.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-warn font-bold">!</span>
                La rotation ne peut jamais être sautée, même si un joueur pense aller plus vite.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-warn font-bold">!</span>
                Les notes papier préparées pendant les 5 minutes sont autorisées, rien d'autre.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-warn font-bold">!</span>
                Le bonus vitesse est assigné automatiquement à l'ordre réel de soumission.
              </li>
            </ul>
          </Panel>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* RIGHT COLUMN — Team monitoring               */}
        {/* ════════════════════════════════════════════ */}
        <div className="space-y-6">
          <Panel eyebrow="Stations" title="Supervision des équipes">
            {teams.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="mb-4 text-text-faint/40"><Radio size={48} strokeWidth={1} /></div>
                <p className="text-base text-text-muted">Aucune équipe à superviser pour le moment.</p>
              </div>
            )}
            <div className="space-y-4">
              {teams.map((team) => {
                const statusLabel = getStatusLabel(team.status);
                return (
                  <article
                    key={team.id}
                    className="rounded-xl border border-border bg-elevated/30 p-5 transition-colors hover:border-border-hover"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-text-faint">
                          {team.station} · {team.teamCode ?? "NO-CODE"}
                        </p>
                        <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-text truncate">{team.name}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Status pill */}
                        <span className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-bold ${
                          statusLabel === "En codage" ? "border-hot/20 bg-hot/10 text-hot" :
                          statusLabel === "Soumise" ? "border-accent/20 bg-accent/10 text-accent-light" :
                          statusLabel === "Corrigee" ? "border-success/20 bg-success/10 text-success" :
                          statusLabel === "Prete" ? "border-cyan/20 bg-cyan/10 text-cyan" :
                          "border-border bg-elevated text-text-faint"
                        }`}>
                          {statusLabel}
                        </span>

                        {/* Active member pill */}
                        {team.activeMember ? (
                          <span className="inline-flex items-center gap-2 rounded-lg border border-hot/20 bg-hot/10 px-3 py-1.5 text-xs font-bold text-hot">
                            <span className="inline-block h-2 w-2 rounded-full bg-hot animate-pulse-glow" />
                            {team.activeMember.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-lg border border-border bg-elevated px-3 py-1.5 text-xs text-text-faint">
                            Aucun joueur actif
                          </span>
                        )}

                        {/* Submission button */}
                        <button
                          className={`rounded-lg border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                            team.submissionOrder !== null
                              ? "border-success/20 bg-success/10 text-success cursor-default"
                              : "border-accent/20 bg-accent/10 text-accent-light hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
                          }`}
                          disabled={team.submissionOrder !== null || busyAction !== null}
                          onClick={() => markSubmitted(team.teamCode ?? "")}
                          type="button"
                        >
                          {busyAction === team.teamCode
                            ? "..."
                            : team.submissionOrder !== null
                              ? `Soumise #${team.submissionOrder}`
                              : "Marquer soumission"}
                        </button>
                      </div>
                    </div>

                    {/* Member cards */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {team.members.map((member) => {
                        const isActive = team.activeMember?.id === member.id;
                        return (
                          <div
                            key={member.id}
                            className={`rounded-lg border px-3 py-3 transition-colors ${
                              isActive
                                ? "border-hot/30 bg-hot/10"
                                : "border-border bg-surface"
                            }`}
                          >
                            <p className={`text-xs font-bold uppercase tracking-wider ${
                              isActive ? "text-hot" :
                              member.relayOrder === 1 ? "text-hot/50" :
                              member.relayOrder === 2 ? "text-cyan/50" :
                              "text-accent-light/50"
                            }`}>
                              Relais {member.relayOrder}
                            </p>
                            <p className={`mt-1.5 text-sm truncate ${isActive ? "text-hot font-bold" : "text-text"}`}>
                              {member.name}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
