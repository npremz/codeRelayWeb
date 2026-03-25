"use client";

import { BriefQrCard } from "@/components/brief-qr-card";
import { LiveNotificationBanner } from "@/components/live-notification-banner";
import { buildLiveTeams, formatClock, getRelayState, getStatusLabel } from "@/lib/demo-game";
import { getPublicBriefUrl } from "@/lib/public-brief";
import { useRoundNotifications } from "@/lib/use-round-notifications";
import { useLiveTeams } from "@/lib/use-live-teams";
import { useEffect, useState } from "react";
import { Trophy, Medal, Tv } from "lucide-react";

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
    <main className="fixed inset-0 overflow-hidden bg-void text-text flex flex-col">
      {/* Notifications overlay (if any) */}
      <div className="shrink-0 z-50">
        <LiveNotificationBanner notification={notification} />
      </div>

      <div className="flex-1 flex flex-col w-full max-w-[1920px] mx-auto p-6 md:p-8 gap-6 min-h-0">
        
        {/* ── HEADER (Top Bar) ── */}
        <header className="shrink-0 flex items-end justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Tv size={20} className="text-accent-light" />
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent-light">Code Relay · TV</p>
              {currentRound && (
                <span className="ml-2 rounded-full border border-border bg-elevated px-3 py-1 text-xs font-bold text-text-muted">
                  {currentRound.name || `Manche ${currentRound.sequence}`}
                </span>
              )}
            </div>
            <h1 className={`font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none ${phaseColor}`}>
              {relayState.phaseLabel}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-faint mb-2">Temps restant</p>
            <div className={`font-display text-7xl md:text-8xl lg:text-[7rem] font-black tracking-tighter leading-none tabular-nums ${phaseColor} ${isUrgent ? "animate-pulse text-hot" : ""}`}>
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

        {/* ── SUBJECT BAR ── */}
        <section className="shrink-0 flex justify-between items-center bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex-1 min-w-0 pr-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan mb-2">Sujet Actif</p>
            {subject ? (
              <div>
                <h2 className="font-display text-4xl font-bold tracking-tight text-text truncate mb-3">{subject.title}</h2>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xl">
                  <span className="text-text-muted">Fichier :</span>
                  <span className="font-mono font-bold text-cyan bg-cyan/10 px-3 py-1 rounded-lg border border-cyan/20">{subject.fileName}</span>
                  <span className="text-text-muted pl-2">Fonction :</span>
                  <span className="font-mono font-bold text-cyan bg-cyan/10 px-3 py-1 rounded-lg border border-cyan/20">{subject.functionName}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-lg">
                  <span className="text-text-muted">Prototype :</span>
                  <code className="font-mono font-bold text-cyan bg-cyan/10 px-3 py-1 rounded-lg border border-cyan/20">
                    {getFunctionPrototype(subject.functionName, subject.prototype)}
                  </code>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-display text-4xl font-bold tracking-tight text-text-faint">Sujet en attente</h2>
                <p className="text-xl text-text-muted mt-2">L'administrateur n'a pas encore assigné de sujet.</p>
              </div>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-6 border-l border-border pl-8">
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mb-2">Brief Public</p>
              <p className="font-mono text-base font-bold text-accent-light bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20">
                {briefUrl.replace(/^https?:\/\//, '')}
              </p>
            </div>
            <div className="bg-white p-2 rounded-xl h-24 w-24 shrink-0 shadow-sm border border-border">
              <BriefQrCard url={briefUrl} compact={true} />
            </div>
          </div>
        </section>

        {/* ── MAIN CONTENT: PODIUM & LEADERBOARD ── */}
        <div className="flex-1 flex gap-6 min-h-0">
          
          {/* Left: Podium (Fixed height) */}
          <div className="w-[40%] flex flex-col gap-6 min-h-0">
            {/* Leader */}
            <div className="flex-1 bg-accent/5 border border-accent/30 rounded-2xl p-6 md:p-8 flex flex-col justify-center text-center relative overflow-hidden">
              <div className="absolute top-5 left-5 bg-warn text-void font-black text-2xl w-12 h-12 flex items-center justify-center rounded-xl shadow-sm">1</div>
              {leader ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-2">Leader Actuel</p>
                  <h3 className="font-display text-5xl md:text-6xl font-black text-text w-full truncate px-8 mb-4">{leader.name}</h3>
                  <div className="flex items-center justify-center gap-3 text-xl text-text-muted font-medium mb-8">
                    <span className="bg-surface px-3 py-1 rounded border border-border">{leader.station}</span>
                    <span>&bull;</span>
                    <span className="font-mono text-accent-light">{leader.teamCode ?? "NO-CODE"}</span>
                  </div>
                  <div className="mt-auto">
                    <p className="font-display text-[7rem] font-black text-accent leading-none tabular-nums drop-shadow-sm">{leader.totalScore}</p>
                    <p className="text-lg font-bold text-accent/50 mt-1">/ 100 points</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Trophy size={48} className="text-accent/20 mb-4" />
                  <p className="text-3xl font-bold text-text-faint">En attente</p>
                </div>
              )}
            </div>
            
            {/* Rank 2 & 3 */}
            <div className="shrink-0 grid grid-cols-2 gap-6">
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
                    <p className="font-display text-5xl font-black text-text tabular-nums leading-none">{team.totalScore}</p>
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
          <div className="w-[60%] flex flex-col bg-surface border border-border rounded-2xl min-h-0 shadow-sm">
            <div className="shrink-0 px-6 py-4 border-b border-border bg-elevated/50 flex justify-between items-center">
              <h3 className="font-display font-bold text-xl text-text uppercase tracking-widest">Classement Live</h3>
              <span className="px-3 py-1 bg-surface border border-border rounded-full text-sm font-bold text-text-muted">
                {teams.length} équipes
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {teams.length === 0 && (
                <div className="m-auto text-center">
                  <Tv size={64} className="mx-auto text-border mb-4" />
                  <p className="text-xl font-medium text-text-muted">En attente de la première équipe</p>
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
                          {getStatusLabel(team.status)}
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
