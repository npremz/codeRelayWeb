"use client";

import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import { useLocale } from "@/components/locale-provider";
import { LiveNotificationBanner } from "@/components/live-notification-banner";
import { PhaseTimer } from "@/components/phase-timer";
import { RankingTable } from "@/components/ranking-table";
import { buildLiveTeams, getRelayState } from "@/lib/demo-game";
import { useRoundNotifications } from "@/lib/use-round-notifications";
import { useLiveTeams } from "@/lib/use-live-teams";
import { useEffect, useState } from "react";

import { UserPlus, BarChart3, BookOpen, Trophy, FileText } from "lucide-react";

export default function HomePage() {
  const { locale, messages } = useLocale();
  const [now, setNow] = useState(0);
  const { teams: storedTeams, round, currentRound } = useLiveTeams();
  const screens = [
    {
      href: "/register",
      label: messages.home.screens.register.label,
      desc: messages.home.screens.register.description,
      icon: <UserPlus size={20} />
    },
    {
      href: "/brief",
      label: messages.home.screens.brief.label,
      desc: messages.home.screens.brief.description,
      icon: <FileText size={20} />
    },
    {
      href: "/results",
      label: messages.home.screens.results.label,
      desc: messages.home.screens.results.description,
      icon: <BarChart3 size={20} />
    }
  ];

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const relayState = getRelayState(round, now, locale);
  const notification = useRoundNotifications(relayState, locale);
  const teams = buildLiveTeams(storedTeams, relayState, locale);

  return (
    <AppFrame
      title={messages.home.title}
      subtitle={messages.home.subtitle}
      currentRound={currentRound}
    >
      <LiveNotificationBanner notification={notification} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Priority: Quick access + Mini ranking ── */}
        <div className="space-y-6">
          {/* Quick access */}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="mb-4 font-display text-lg font-bold tracking-tight">{messages.home.quickAccess}</h3>
            <div className="grid gap-3">
              {screens.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-elevated/50 px-4 py-4 transition-all hover:border-accent/30 hover:bg-accent/5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-base text-accent-light transition-colors group-hover:bg-accent/10">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold tracking-tight text-text">{item.label}</p>
                    <p className="text-sm text-text-faint">{item.desc}</p>
                  </div>
                  <svg className="ml-auto h-5 w-5 shrink-0 text-text-faint transition-transform group-hover:translate-x-1 group-hover:text-accent-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Top 5 ranking */}
          <RankingTable teams={teams.slice(0, 5)} compact />
        </div>

        {/* ── Hero + Timer + Rules ──── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero banner */}
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                  {messages.home.title}
                </h2>
                <p className="mt-2 text-base text-text-muted">
                  {messages.home.heroSummary}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="rounded-xl border border-border bg-surface px-4 md:px-5 py-3 text-center flex-1 sm:flex-none">
                  <p className="font-display text-2xl md:text-3xl font-bold text-text">{storedTeams.length}</p>
                  <p className="text-[10px] md:text-xs uppercase tracking-wider text-text-faint">{messages.home.stats.teams}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface px-4 md:px-5 py-3 text-center flex-1 sm:flex-none">
                  <p className="font-display text-2xl md:text-3xl font-bold text-text">{storedTeams.length * 3}</p>
                  <p className="text-[10px] md:text-xs uppercase tracking-wider text-text-faint">{messages.home.stats.players}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface px-4 md:px-5 py-3 text-center flex-1 sm:flex-none">
                  <p className={`font-display text-2xl md:text-3xl font-bold ${round.registrationOpen ? "text-success" : "text-hot"}`}>
                    {round.registrationOpen ? "ON" : "OFF"}
                  </p>
                  <p className="text-[10px] md:text-xs uppercase tracking-wider text-text-faint">{messages.home.stats.registration}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timer */}
          <PhaseTimer state={relayState} />

          {/* Rules + Scoring */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Rules */}
            <div className="rounded-2xl border border-success/15 bg-surface p-6">
              <div className="flex items-start gap-4">
                <span className="text-success mt-1"><BookOpen size={24} /></span>
                <div>
                  <h3 className="font-display text-lg font-bold tracking-tight">{messages.home.rulesTitle}</h3>
                  <ul className="mt-3 space-y-2.5 text-sm text-text-muted">
                    {messages.home.rules.map((rule) => (
                      <li key={rule} className="flex items-start gap-2">
                        <span className="mt-0.5 text-cyan">→</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Scoring */}
            <div className="rounded-2xl border border-warn/15 bg-surface p-6">
              <div className="flex items-start gap-4">
                <span className="text-warn mt-1"><Trophy size={24} /></span>
                <div>
                  <h3 className="font-display text-lg font-bold tracking-tight">{messages.home.scoringTitle}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg bg-elevated px-3 py-2.5 text-center">
                      <p className="font-display text-2xl font-bold text-warn">40</p>
                      <p className="text-xs text-text-faint">{messages.home.scoring.correction}</p>
                    </div>
                    <div className="rounded-lg bg-elevated px-3 py-2.5 text-center">
                      <p className="font-display text-2xl font-bold text-cyan">20</p>
                      <p className="text-xs text-text-faint">{messages.home.scoring.edgeCases}</p>
                    </div>
                    <div className="rounded-lg bg-elevated px-3 py-2.5 text-center">
                      <p className="font-display text-2xl font-bold text-accent-light">20</p>
                      <p className="text-xs text-text-faint">{messages.home.scoring.complexity}</p>
                    </div>
                    <div className="rounded-lg bg-elevated px-3 py-2.5 text-center">
                      <p className="font-display text-2xl font-bold text-success">10+10</p>
                      <p className="text-xs text-text-faint">{messages.home.scoring.readabilityAndSpeed}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
