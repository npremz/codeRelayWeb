"use client";

import { formatClock, getRoundActionLabel } from "@/lib/demo-game";
import { LiveTeam, RelayState, RoundSummary } from "@/lib/game-types";
import { useLocale } from "@/components/locale-provider";
import { Activity, CheckCircle2, RadioTower, Send, TimerReset } from "lucide-react";
import { ReactNode } from "react";

type StaffStatusHeaderProps = {
  currentRound?: RoundSummary | null;
  relayState: RelayState;
  registrationOpen: boolean;
  connected: boolean;
  teams: LiveTeam[];
};

type HeaderMetric = {
  label: string;
  value: number;
  icon: ReactNode;
  tint: string;
};

export function StaffStatusHeader({
  currentRound,
  relayState,
  registrationOpen,
  connected,
  teams
}: StaffStatusHeaderProps) {
  const { locale } = useLocale();
  const metrics: HeaderMetric[] = [
    {
      label: locale === "en" ? "Active" : "Actives",
      value: teams.filter((team) => team.status === "coding").length,
      icon: <Activity size={16} />,
      tint: "text-hot"
    },
    {
      label: locale === "en" ? "Submitted" : "Soumises",
      value: teams.filter((team) => team.status === "submitted").length,
      icon: <Send size={16} />,
      tint: "text-accent-light"
    },
    {
      label: locale === "en" ? "Scored" : "Corrigees",
      value: teams.filter((team) => team.status === "scored").length,
      icon: <CheckCircle2 size={16} />,
      tint: "text-success"
    }
  ];

  return (
    <div className="-mx-1 mb-6 rounded-[1.75rem] border border-border/80 bg-surface/90 px-4 py-4 shadow-sm backdrop-blur-xl md:mx-0 md:px-5 lg:sticky lg:top-0 lg:z-30">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-light">
              {locale === "en" ? "Staff control" : "Pilotage staff"}
            </p>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="break-safe font-display text-xl font-bold tracking-tight text-text md:text-2xl">
                {currentRound?.name || (locale === "en" ? "Current round" : "Manche courante")}
              </h2>
              <span className="surface-chip">
                {getRoundActionLabel(relayState.phase, locale)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`surface-chip ${registrationOpen ? "text-success" : "text-hot"}`}>
              {registrationOpen ? (locale === "en" ? "Registration open" : "Inscriptions ouvertes") : (locale === "en" ? "Registration closed" : "Inscriptions fermees")}
            </span>
            <span className={`surface-chip ${connected ? "text-success" : "text-hot"}`}>
              <RadioTower size={14} />
              {connected ? "Live" : (locale === "en" ? "Offline" : "Hors ligne")}
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-light">
                  {locale === "en" ? "Time remaining" : "Temps restant"}
                </p>
                <p className="mt-2 font-display text-4xl font-bold tracking-tight text-text md:text-5xl">
                  {formatClock(relayState.remainingMs)}
                </p>
              </div>
              <div className="rounded-2xl bg-surface p-3 text-accent-light shadow-sm ring-1 ring-border/70">
                <TimerReset size={24} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-border bg-surface px-3 py-4 text-center">
                <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-elevated ${metric.tint}`}>
                  {metric.icon}
                </div>
                <p className="mt-3 font-display text-2xl font-bold tracking-tight text-text">{metric.value}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-text-faint">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
