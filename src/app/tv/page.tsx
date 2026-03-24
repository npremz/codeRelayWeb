"use client";

import { BriefQrCard } from "@/components/brief-qr-card";
import { LiveNotificationBanner } from "@/components/live-notification-banner";
import { buildLiveTeams, formatClock, getRelayState, getStatusLabel } from "@/lib/demo-game";
import { getPublicBriefUrl } from "@/lib/public-brief";
import { useRoundNotifications } from "@/lib/use-round-notifications";
import { useLiveTeams } from "@/lib/use-live-teams";
import { useEffect, useState } from "react";
import { Trophy, Medal, Tv } from "lucide-react";

function getPhaseColor(phase: string) {
  switch (phase) {
    case "reflection": return "text-cyan";
    case "relay": return "text-hot";
    case "paused": return "text-warn";
    case "complete": return "text-success";
    default: return "text-accent-light";
  }
}

function getPhaseGlow(phase: string) {
  switch (phase) {
    case "reflection": return "rgba(34, 211, 238, 0.15)";
    case "relay": return "rgba(255, 107, 107, 0.15)";
    case "paused": return "rgba(255, 212, 59, 0.15)";
    case "complete": return "rgba(81, 207, 102, 0.15)";
    default: return "rgba(108, 92, 231, 0.15)";
  }
}

function getTimerBg(phase: string) {
  switch (phase) {
    case "reflection": return "bg-cyan";
    case "relay": return "bg-hot";
    case "paused": return "bg-warn";
    case "complete": return "bg-success";
    default: return "bg-accent";
  }
}

function getStatusBadgeClasses(statusLabel: string) {
  switch (statusLabel) {
    case "En codage": return "border-hot/20 bg-hot/10 text-hot";
    case "Soumise": return "border-accent/20 bg-accent/10 text-accent-light";
    case "Corrigee": return "border-success/20 bg-success/10 text-success";
    case "Prete": return "border-cyan/20 bg-cyan/10 text-cyan";
    default: return "border-border bg-elevated text-text-faint";
  }
}

export default function TvPage() {
  const [now, setNow] = useState(0);
  const { teams: storedTeams, round, currentRound } = useLiveTeams();

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  const relayState = getRelayState(round, now);
  const notification = useRoundNotifications(relayState);
  const teams = buildLiveTeams(storedTeams, relayState);
  const leader = teams[0];
  const isUrgent = relayState.isRunning && relayState.remainingMs > 0 && relayState.remainingMs <= 30000;
  const phaseColor = getPhaseColor(relayState.phase);
  const timerBg = getTimerBg(relayState.phase);
  const subject = currentRound?.subject ?? null;
  const briefUrl = getPublicBriefUrl();

  return (
    <main className="relative min-h-screen overflow-hidden bg-void text-text">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse at top left, ${getPhaseGlow(relayState.phase)}, transparent 50%), radial-gradient(ellipse at bottom right, rgba(108, 92, 231, 0.08), transparent 40%)`
        }}
      />

      <LiveNotificationBanner notification={notification} />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1800px] flex-col gap-6 px-8 py-6 md:px-10 md:py-8">
        {/* ── Top bar: Phase + Timer + Round ──────────── */}
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-light">Code Relay · Écran TV</p>
                {currentRound && (
                  <div className="round-badge">
                    <span className="round-badge-dot" />
                    {currentRound.name || `Manche ${currentRound.sequence}`}
                  </div>
                )}
              </div>
            </div>
            <h1 className={`mt-3 font-display text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl ${phaseColor}`}>
              {relayState.phaseLabel}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm uppercase tracking-wider text-text-faint">Temps restant</p>
            <p className={`mt-1 font-display text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl ${phaseColor} ${isUrgent ? "animate-pulse-glow" : ""}`}>
              {formatClock(relayState.remainingMs)}
            </p>
          </div>
        </header>

        {/* Progress bar */}
        <div className="h-2 overflow-hidden rounded-full bg-elevated">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-linear ${timerBg}`}
            style={{ width: `${Math.min(100, relayState.progress)}%` }}
          />
        </div>

        <section className="grid gap-4 rounded-2xl border border-cyan/20 bg-cyan/5 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan">Sujet actif</p>
            {subject ? (
              <>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-text md:text-4xl">
                  {subject.title}
                </h2>
                <p className="mt-3 text-sm uppercase tracking-[0.18em] text-text-faint">Fichier à sortir</p>
                <p className="mt-2 font-display text-3xl font-bold tracking-tight text-cyan md:text-5xl">
                  {subject.fileName}
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-text-faint md:text-4xl">
                  Sujet en attente
                </h2>
                <p className="mt-2 text-base text-text-muted">
                  L'administrateur n'a pas encore assigné de sujet à cette manche.
                </p>
              </>
            )}
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-light">Brief public</p>
            {subject ? (
              <>
                <p className="mt-3 text-sm leading-6 text-text-muted">
                  {subject.brief || "Le brief détaillé est disponible sur la page publique."}
                </p>
                <div className="mt-4 space-y-2 text-sm text-text">
                  <p>Fonction attendue: <span className="font-semibold text-cyan">{subject.functionName}</span></p>
                  <p>Page brief: <span className="font-semibold text-accent-light">{briefUrl}</span></p>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-text-muted">
                Le brief sera publié automatiquement dès qu'un sujet sera assigné.
              </p>
            )}
            </div>
            <BriefQrCard url={briefUrl} />
          </div>
        </section>

        {/* ── Main content grid ──────────────────────── */}
        <div className="grid flex-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          {/* Left: Leader + Podium */}
          <div className="space-y-6">
            {/* Leader card */}
            <section className="rounded-2xl border border-accent/20 bg-accent/5 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-light">Leader actuel</p>
              {leader ? (
                <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div className="min-w-0">
                    <h2 className="font-display text-4xl font-bold tracking-tight text-text md:text-5xl lg:text-6xl truncate">
                      {leader.name}
                    </h2>
                    <p className="mt-2 text-sm text-text-muted">
                      {leader.station} · {leader.teamCode ?? "NO-CODE"}
                      {leader.submissionOrder ? ` · Soumission #${leader.submissionOrder}` : " · En course"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-6xl font-bold tracking-tight text-accent-light md:text-7xl">
                      {leader.totalScore}
                    </p>
                    <p className="mt-1 text-sm text-text-faint">/ 100</p>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <h2 className="font-display text-4xl font-bold tracking-tight text-text-faint">En attente</h2>
                  <p className="mt-2 text-base text-text-muted">Aucune équipe classée</p>
                </div>
              )}
            </section>

            {/* Podium top 3 */}
            <div className="grid gap-4 md:grid-cols-3">
              {teams.slice(0, 3).map((team) => {
                const rankEmoji = team.rank === 1 ? <Trophy size={24} className="text-warn" /> : <Medal size={24} className={team.rank === 2 ? "text-text-muted" : "text-hot"} />;
                const rankBorder = team.rank === 1 ? "border-warn/30" : team.rank === 2 ? "border-text-muted/20" : "border-hot/20";
                const rankBg = team.rank === 1 ? "bg-warn/5" : team.rank === 2 ? "bg-text-muted/5" : "bg-hot/5";
                return (
                  <article key={team.id} className={`rounded-2xl border ${rankBorder} ${rankBg} p-5`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center justify-center h-8 w-8">{rankEmoji}</span>
                      <span className="font-display text-3xl font-bold tracking-tight text-text">{team.totalScore}</span>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-bold tracking-tight text-text truncate">{team.name}</h3>
                    <p className="mt-1 text-sm text-text-faint">
                      {team.station} · {team.teamCode ?? "NO-CODE"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {team.activeMember ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-hot/20 bg-hot/10 px-3 py-1.5 text-xs font-medium text-hot">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-hot animate-pulse-glow" />
                          {team.activeMember.name}
                        </span>
                      ) : null}
                      {team.submissionOrder ? (
                        <span className="inline-flex items-center rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                          Soumise #{team.submissionOrder}
                        </span>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Right: Full team list */}
          <section className="rounded-2xl border border-border bg-surface p-6 md:p-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-light">Classement</p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-text">Toutes les équipes</h2>
              </div>
              <p className="text-sm text-text-faint">{teams.length} équipes</p>
            </div>

            <div className="space-y-3">
              {teams.length === 0 && (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="mb-3 text-text-faint/40"><Tv size={48} strokeWidth={1} /></div>
                  <p className="text-base text-text-muted">En attente des inscriptions.</p>
                </div>
              )}
              {teams.map((team) => {
                const statusLabel = getStatusLabel(team.status);
                return (
                  <article
                    key={team.id}
                    className="rounded-xl border border-border bg-elevated/30 p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                          team.rank <= 3
                            ? team.rank === 1 ? "bg-warn/15 text-warn" : team.rank === 2 ? "bg-text-muted/10 text-text-muted" : "bg-hot/10 text-hot"
                            : "bg-elevated text-text-faint"
                        }`}>
                          {team.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="font-display text-base font-bold tracking-tight text-text truncate">{team.name}</p>
                          <p className="mt-0.5 text-sm text-text-faint truncate">
                            {team.teamCode ?? "—"} · {team.members.map((m) => m.name).join(" / ")}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`font-display text-2xl font-bold tracking-tight ${team.rank === 1 ? "text-warn" : "text-text"}`}>
                          {team.totalScore}
                        </p>
                      </div>
                    </div>

                    {/* Progress + status */}
                    <div className="mt-3 flex items-center gap-4">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${timerBg}`}
                          style={{ width: `${team.progress}%` }}
                        />
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {team.activeMember && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-hot/20 bg-hot/10 px-2.5 py-1 text-xs font-medium text-hot">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-hot animate-pulse-glow" />
                            {team.activeMember.name}
                          </span>
                        )}
                        <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClasses(statusLabel)}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    {team.tieBreakNote && (
                      <p className="mt-2 text-xs font-medium text-accent-light">{team.tieBreakNote}</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
