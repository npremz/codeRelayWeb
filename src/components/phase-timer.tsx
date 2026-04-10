"use client";

import { useLocale } from "@/components/locale-provider";
import { formatClock } from "@/lib/demo-game";
import { Panel } from "@/components/panel";
import { RelayState } from "@/lib/game-types";
import { MessageCircle, Zap, Pause, CheckCircle, Clock } from "lucide-react";

type PhaseTimerProps = {
  state: RelayState;
  large?: boolean;
};

function getPhaseConfig(state: RelayState, locale: "fr" | "en") {
  switch (state.phase) {
    case "reflection":
      return {
        accent: "cyan" as const,
        icon: <MessageCircle size={24} className="text-cyan" />,
        statusLabel: locale === "en" ? "Strategy in progress" : "Réflexion en cours",
        hint: locale === "en" ? "Team members are discussing and preparing their strategy" : "Les membres discutent et préparent leur stratégie",
        timerColor: "text-cyan",
        barColor: "bg-cyan",
        bgTint: "bg-cyan/5"
      };
    case "relay":
      if (state.isTransition) {
        return {
          accent: "warn" as const,
          icon: <Clock size={24} className="text-warn" />,
          statusLabel: locale === "en" ? "Seat change" : "Changement de place",
          hint: locale === "en" ? "10 seconds to rotate players before the next relay" : "10 secondes pour permuter avant le relais suivant",
          timerColor: "text-warn",
          barColor: "bg-warn",
          bgTint: "bg-warn/5"
        };
      }

      return {
        accent: "hot" as const,
        icon: <Zap size={24} className="text-hot" />,
        statusLabel: locale === "en" ? `Relay · Turn ${state.currentSlice + 1}` : `Relais · Tour ${state.currentSlice + 1}`,
        hint: locale === "en" ? "Total silence — the keyboard player codes alone" : "Silence total — le joueur au clavier code seul",
        timerColor: "text-hot",
        barColor: "bg-hot",
        bgTint: "bg-hot/5"
      };
    case "paused":
      if (state.isTransition) {
        return {
          accent: "warn" as const,
          icon: <Pause size={24} className="text-warn" />,
          statusLabel: locale === "en" ? "Paused during seat change" : "Pause pendant changement",
          hint: locale === "en" ? "Player rotation is paused until the organizer resumes" : "La rotation des joueurs est en pause jusqu'à reprise",
          timerColor: "text-warn",
          barColor: "bg-warn",
          bgTint: "bg-warn/5"
        };
      }

      return {
        accent: "warn" as const,
        icon: <Pause size={24} className="text-warn" />,
        statusLabel: locale === "en" ? "Paused" : "Pause",
        hint: locale === "en" ? "Timer frozen — waiting for the organizer to resume" : "Chronomètre gelé — reprise par l'organisateur",
        timerColor: "text-warn",
        barColor: "bg-warn",
        bgTint: "bg-warn/5"
      };
    case "complete":
      return {
        accent: "success" as const,
        icon: <CheckCircle size={24} className="text-success" />,
        statusLabel: locale === "en" ? "Round complete" : "Manche terminée",
        hint: locale === "en" ? "The judges can finalize scoring" : "Le jury peut finaliser l'évaluation",
        timerColor: "text-success",
        barColor: "bg-success",
        bgTint: "bg-success/5"
      };
    case "draft":
    default:
      return {
        accent: "accent" as const,
        icon: <Clock size={24} className="text-accent-light" />,
        statusLabel: state.phaseLabel,
        hint: locale === "en" ? "Waiting for the organizer to start" : "En attente du lancement par l'organisateur",
        timerColor: "text-accent-light",
        barColor: "bg-accent",
        bgTint: "bg-accent/5"
      };
  }
}

export function PhaseTimer({ state, large = false }: PhaseTimerProps) {
  const { locale } = useLocale();
  const progress = Math.min(100, state.progress);
  const config = getPhaseConfig(state, locale);
  const isUrgent = state.isRunning && state.remainingMs > 0 && state.remainingMs <= 30000;

  return (
    <Panel accent={config.accent}>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        {/* Left: status */}
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${config.bgTint}`}>
            {config.icon}
          </div>
          <div>
            <p className={`text-sm font-bold uppercase tracking-wider ${config.timerColor}`}>
              {config.statusLabel}
            </p>
            <p className="mt-1 text-sm text-text-muted">{config.hint}</p>
          </div>
        </div>

        {/* Right: countdown */}
        <div className="text-right">
          <p className={`font-display tracking-tight font-bold ${
            large ? "text-6xl md:text-7xl" : "text-5xl md:text-6xl"
          } ${config.timerColor} ${isUrgent ? "animate-pulse-glow" : ""}`}>
            {formatClock(state.remainingMs)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-elevated">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${config.barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-sm text-text-faint">
          <span>{locale === "en" ? "40 correctness · 20 edge · 20 complexity · 10 readability · 10 speed" : "40 correction · 20 edge · 20 complexité · 10 lisibilité · 10 rapidité"}</span>
          <span className="font-display font-bold">{progress}%</span>
        </div>
      </div>
    </Panel>
  );
}
