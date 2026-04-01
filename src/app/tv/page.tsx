"use client";

import { BriefQrCard } from "@/components/brief-qr-card";
import { useLocale } from "@/components/locale-provider";
import { LiveNotificationBanner } from "@/components/live-notification-banner";
import { buildLiveTeams, formatClock, getRelayState, getStatusLabel } from "@/lib/demo-game";
import { getPublicBriefUrl, getPublicRegisterUrl } from "@/lib/public-brief";
import { useRoundNotifications } from "@/lib/use-round-notifications";
import { useLiveTeams } from "@/lib/use-live-teams";
import { formatCopy } from "@/lib/locale";
import { useEffect, useState } from "react";
import { Trophy, Tv, Users, QrCode, FileText } from "lucide-react";

function getFunctionPrototype(functionName: string, explicitPrototype?: string) {
  if (explicitPrototype?.trim()) {
    return explicitPrototype.trim();
  }

  const normalized = functionName.trim();
  return normalized ? `def ${normalized}(...):` : "def solution(...):";
}

function getPhaseColor(phase: string) {
  switch (phase) {
    case "reflection": return "text-cyan";
    case "relay": return "text-hot";
    case "paused": return "text-warn";
    case "complete": return "text-success";
    default: return "text-accent-light";
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

export default function TvPage() {
  const { locale, messages } = useLocale();
  const [now, setNow] = useState(0);
  const { teams: storedTeams, round, currentRound } = useLiveTeams();

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  const relayState = getRelayState(round, now, locale);
  const notification = useRoundNotifications(relayState, locale);
  const teams = buildLiveTeams(storedTeams, relayState, locale);
  const leader = teams[0];
  const isUrgent = relayState.isRunning && relayState.remainingMs > 0 && relayState.remainingMs <= 30000;
  const phaseColor = getPhaseColor(relayState.phase);
  const timerBg = getTimerBg(relayState.phase);
  const subject = currentRound?.subject ?? null;
  const briefUrl = getPublicBriefUrl(locale);
  const registerUrl = getPublicRegisterUrl(locale);

  if (round.tvDisplayMode === "registration_qr") {
    return (
      <main className="fixed inset-0 overflow-hidden bg-void text-text">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(21,184,166,0.12),transparent_45%),radial-gradient(circle_at_bottom,rgba(108,92,231,0.08),transparent_40%)]" />
        <div className="relative flex h-full w-full items-center justify-center p-6 md:p-10">
          <section className="grid w-full max-w-[1900px] gap-8 rounded-[2rem] border border-cyan/20 bg-surface/95 p-8 shadow-2xl lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
            <div className="flex flex-col justify-center">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan">
                  <QrCode size={16} />
                  {messages.tv.registrationTag}
                </span>
                {currentRound && (
                  <span className="rounded-full border border-border bg-elevated px-4 py-2 text-sm font-bold text-text-muted">
                    {currentRound.name || (locale === "en" ? `Round ${currentRound.sequence}` : `Manche ${currentRound.sequence}`)}
                  </span>
                )}
              </div>

              <h1 className="font-display text-5xl font-black tracking-tight text-text sm:text-6xl lg:text-8xl">
                {messages.tv.createTeam}
              </h1>
              <p className="mt-6 max-w-3xl text-xl leading-relaxed text-text-muted sm:text-2xl lg:text-3xl">
                {messages.tv.registrationDescription}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-cyan/20 bg-cyan/5 px-5 py-4">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan">{messages.tv.prerequisites}</p>
                  <p className="mt-2 text-lg text-text-muted">{messages.tv.prerequisitesDescription}</p>
                </div>
                <div className="rounded-2xl border border-accent/20 bg-accent/5 px-5 py-4">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-light">{messages.tv.directLink}</p>
                  <p className="mt-2 code-break-safe font-mono text-base font-bold text-text">
                    {registerUrl.replace(/^https?:\/\//, "")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-border bg-elevated/40 p-4 lg:p-8">
              <div className="h-[45vw] max-h-[784px] w-[45vw] max-w-[784px] rounded-[2rem] border border-border bg-white p-6 shadow-xl">
                <BriefQrCard url={registerUrl} bare />
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4">
                <Users className="text-cyan" size={22} />
                <p className="text-xl font-semibold text-text-muted">{messages.tv.scanToRegister}</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (round.tvDisplayMode === "brief") {
    return (
      <main className="fixed inset-0 overflow-hidden bg-void text-text">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(108,92,231,0.10),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(21,184,166,0.08),transparent_34%)]" />
        <div className="relative flex h-full w-full flex-col p-6 md:p-8">
          <header className="mb-5 flex flex-col gap-5 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-accent-light">
                  <FileText size={16} />
                  {messages.tv.briefTag}
                </span>
                {currentRound && (
                  <span className="rounded-full border border-border bg-elevated px-4 py-2 text-sm font-bold text-text-muted">
                    {currentRound.name || (locale === "en" ? `Round ${currentRound.sequence}` : `Manche ${currentRound.sequence}`)}
                  </span>
                )}
              </div>
              <h1 className="font-display text-4xl font-black tracking-tight text-text sm:text-5xl lg:text-6xl">
                {messages.tv.roundBrief}
              </h1>
            </div>
            <div className="w-full text-left sm:w-auto sm:text-right">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-text-faint">{messages.tv.timeRemaining}</p>
              <div className={`font-display text-6xl font-black tracking-tighter leading-none tabular-nums sm:text-7xl md:text-8xl lg:text-[7rem] ${phaseColor} ${isUrgent ? "animate-pulse text-hot" : ""}`}>
                {formatClock(relayState.remainingMs)}
              </div>
            </div>
          </header>

          <div className="mb-5 h-3 w-full rounded-full border border-border bg-elevated overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-linear ${timerBg}`}
              style={{ width: `${Math.min(100, relayState.progress)}%` }}
            />
          </div>

          <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[1fr_0.44fr]">
            <section className="flex min-h-0 flex-col gap-6">
              <div className="rounded-[2rem] border border-cyan/20 bg-surface/90 p-6 shadow-xl lg:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan">{messages.tv.fileName}</p>
                <p className="mt-4 code-break-safe font-mono text-4xl font-black leading-tight text-text lg:text-6xl">
                  {subject?.fileName ?? messages.tv.noFile}
                </p>
              </div>

              <div className="flex-1 rounded-[2rem] border border-accent/20 bg-surface/90 p-6 shadow-xl lg:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-light">Prototype</p>
                <code className="mt-4 block code-break-safe font-mono text-3xl font-black leading-tight text-text lg:text-5xl">
                  {subject ? getFunctionPrototype(subject.functionName, subject.prototype) : "def solution(...):"}
                </code>
              </div>
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-border bg-surface/90 p-6 shadow-xl lg:p-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-faint">{messages.tv.fullDetails}</p>
                  <p className="mt-2 text-lg text-text-muted lg:text-xl">
                    {messages.tv.scanToOpenBrief}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-cyan">
                  <QrCode size={16} />
                  QR
                </span>
              </div>

              <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[1.75rem] border border-border bg-white p-6 lg:p-8">
                <div className="aspect-square w-full max-w-[520px]">
                  <BriefQrCard url={briefUrl} bare />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-void text-text flex flex-col">
      {/* Notifications overlay (if any) */}
      <div className="shrink-0 z-50">
        <LiveNotificationBanner notification={notification} />
      </div>

      <div className="flex-1 flex flex-col w-full max-w-[1920px] mx-auto p-6 md:p-8 gap-6 min-h-0">
        
        {/* ── HEADER (Top Bar) ── */}
        <header className="shrink-0 flex flex-col gap-5 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <Tv size={20} className="text-accent-light" />
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent-light">{messages.tv.leaderboardTag}</p>
              {currentRound && (
                <span className="ml-2 rounded-full border border-border bg-elevated px-3 py-1 text-xs font-bold text-text-muted">
                  {currentRound.name || (locale === "en" ? `Round ${currentRound.sequence}` : `Manche ${currentRound.sequence}`)}
                </span>
              )}
            </div>
            <h1 className={`break-safe font-display text-4xl font-bold tracking-tight leading-none sm:text-5xl md:text-6xl lg:text-7xl ${phaseColor}`}>
              {messages.tv.leaderboardTitle}
            </h1>
          </div>
          <div className="w-full text-left sm:w-auto sm:text-right">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-faint mb-2">{messages.tv.timeRemaining}</p>
            <div className={`font-display text-6xl font-black tracking-tighter leading-none tabular-nums sm:text-7xl md:text-8xl lg:text-[7rem] ${phaseColor} ${isUrgent ? "animate-pulse text-hot" : ""}`}>
              {formatClock(relayState.remainingMs)}
            </div>
          </div>
        </header>

        {/* ── PROGRESS BAR ── */}
        <div className="shrink-0 h-3 w-full rounded-full bg-elevated border border-border overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-linear ${timerBg}`} 
            style={{ width: `${Math.min(100, relayState.progress)}%` }} 
          />
        </div>

        {/* ── MAIN CONTENT: PODIUM & LEADERBOARD ── */}
        <div className="flex-1 flex min-h-0 flex-col gap-6 lg:flex-row">
          
          {/* Left: Podium (Fixed height) */}
          <div className="flex min-h-0 w-full flex-col gap-6 lg:w-[40%]">
            {/* Leader */}
            <div className="flex-1 bg-accent/5 border border-accent/30 rounded-2xl p-6 md:p-8 flex flex-col justify-center text-center relative overflow-hidden">
              <div className="absolute top-5 left-5 bg-warn text-void font-black text-2xl w-12 h-12 flex items-center justify-center rounded-xl shadow-sm">1</div>
              {leader ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-2">{messages.tv.currentLeader}</p>
                  <h3 className="font-display text-5xl md:text-6xl font-black text-text w-full truncate px-8 mb-4">{leader.name}</h3>
                  <div className="flex items-center justify-center gap-3 text-xl text-text-muted font-medium mb-8">
                    <span className="bg-surface px-3 py-1 rounded border border-border">{leader.station}</span>
                    <span>&bull;</span>
                    <span className="font-mono text-accent-light">{leader.teamCode ?? "NO-CODE"}</span>
                  </div>
                  <div className="mt-auto">
                    <p className="font-display text-[7rem] font-black text-accent leading-none tabular-nums drop-shadow-sm">{leader.totalScore}</p>
                    <p className="text-lg font-bold text-accent/50 mt-1">{messages.tv.totalPoints}</p>
                    {leader.carryOverScore > 0 && (
                      <p className="mt-2 text-sm font-semibold text-text-muted">
                        {formatCopy(messages.tv.carryOver, {
                          carry: leader.carryOverScore,
                          round: leader.roundScore
                        })}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Trophy size={48} className="text-accent/20 mb-4" />
                  <p className="text-3xl font-bold text-text-faint">{messages.tv.waiting}</p>
                </div>
              )}
            </div>
            
            {/* Rank 2 & 3 */}
            <div className="shrink-0 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {teams.slice(1, 3).map(team => (
                <div key={team.id} className="bg-surface border border-border rounded-2xl p-5 flex flex-col relative shadow-sm">
                  <div className={`absolute top-4 right-4 font-black text-lg w-8 h-8 flex items-center justify-center rounded-lg ${team.rank === 2 ? 'bg-elevated text-text-muted border border-border' : 'bg-elevated text-amber-600/70 border border-border'}`}>
                    {team.rank}
                  </div>
                  <h4 className="font-display text-2xl font-bold text-text truncate pr-10 mb-1">{team.name}</h4>
                  <p className="text-sm text-text-muted font-medium mb-6">
                    {team.station} <span className="mx-1">&bull;</span> <span className="font-mono">{team.teamCode}</span>
                  </p>
                  <div className="mt-auto flex items-end justify-between">
                    <div>
                      <p className="font-display text-5xl font-black text-text tabular-nums leading-none">{team.totalScore}</p>
                      {team.carryOverScore > 0 && (
                        <p className="mt-1 text-xs font-semibold text-text-faint">
                          {team.carryOverScore} + {team.roundScore}
                        </p>
                      )}
                    </div>
                    {team.activeMember && (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hot opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-hot"></span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {/* Empty state placeholders to maintain grid structure */}
              {teams.length < 2 && <div className="bg-elevated/30 border border-border border-dashed rounded-2xl" />}
              {teams.length < 3 && <div className="bg-elevated/30 border border-border border-dashed rounded-2xl" />}
            </div>
          </div>

          {/* Right: Leaderboard List (Scrollable) */}
          <div className="flex min-h-0 w-full flex-col rounded-2xl border border-border bg-surface shadow-sm lg:w-[60%]">
            <div className="shrink-0 flex flex-col gap-3 border-b border-border bg-elevated/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="break-safe font-display text-xl font-bold uppercase tracking-widest text-text">{messages.tv.liveLeaderboard}</h3>
              <span className="w-fit px-3 py-1 bg-surface border border-border rounded-full text-sm font-bold text-text-muted">
                {formatCopy(messages.tv.teamsCount, { count: teams.length })}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {teams.length === 0 && (
                <div className="m-auto text-center">
                  <Tv size={64} className="mx-auto text-border mb-4" />
                  <p className="text-xl font-medium text-text-muted">{messages.tv.waitingFirstTeam}</p>
                </div>
              )}
              
              {teams.map(team => {
                const isTop3 = team.rank <= 3;
                return (
                  <div key={team.id} className={`flex items-center gap-5 p-4 rounded-xl border ${isTop3 ? 'border-border bg-surface shadow-sm' : 'border-border/50 bg-elevated/30'}`}>
                    <div className="w-10 shrink-0 text-center font-display font-black text-3xl text-text-muted opacity-50">
                      {team.rank}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 mb-2">
                        <p className="font-display font-bold text-2xl text-text truncate">{team.name}</p>
                        <p className="text-sm font-mono text-text-faint">{team.teamCode}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-2 flex-1 rounded-full bg-elevated border border-border overflow-hidden">
                          <div className={`h-full ${timerBg} transition-all duration-500`} style={{width: `${team.progress}%`}} />
                        </div>
                        <span className="w-24 shrink-0 text-right text-xs font-bold uppercase tracking-wider text-text-muted">
                          {getStatusLabel(team.status, locale)}
                        </span>
                      </div>
                    </div>
                    
                    <div className={`w-20 shrink-0 text-right font-display font-black text-4xl tabular-nums ${team.rank === 1 ? 'text-warn' : 'text-text'}`}>
                      {team.totalScore}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
