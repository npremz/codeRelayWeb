"use client";

import { useEffect, useRef, useState } from "react";
import { RelayState } from "@/lib/game-types";
import { DEFAULT_LOCALE, Locale } from "@/lib/locale";

export type LiveNotification = {
  id: string;
  title: string;
  message: string;
  tone: "signal" | "lime" | "fog";
};

const DISPLAY_MS = 4500;
const WARNING_THRESHOLD_MS = 10000;

export function useRoundNotifications(state: RelayState, locale: Locale = DEFAULT_LOCALE) {
  const [notification, setNotification] = useState<LiveNotification | null>(null);
  const previousStateRef = useRef<RelayState | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const warningKeyRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function showNotification(next: Omit<LiveNotification, "id">) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      setNotification({ ...next, id });
      timeoutRef.current = window.setTimeout(() => {
        setNotification((current) => (current?.id === id ? null : current));
      }, DISPLAY_MS);
    }

    const previousState = previousStateRef.current;
    const warningKey = `${state.phase}-${state.currentSlice}`;

    if (state.isRunning && state.remainingMs > 0 && state.remainingMs <= WARNING_THRESHOLD_MS) {
      if (warningKeyRef.current !== warningKey) {
        showNotification({
          tone: "signal",
          title: locale === "en" ? "Ending soon" : "Fin imminente",
          message:
            state.phase === "relay"
              ? locale === "en"
                ? "Less than 10 seconds before the next rotation."
                : "Moins de 10 secondes avant la rotation suivante."
              : locale === "en"
                ? "Less than 10 seconds before the end of strategy time."
                : "Moins de 10 secondes avant la fin de la réflexion."
        });
        warningKeyRef.current = warningKey;
      }
    } else if (warningKeyRef.current === warningKey) {
      warningKeyRef.current = null;
    }

    if (!previousState) {
      previousStateRef.current = state;
      return;
    }

    if (previousState.phase !== state.phase) {
      if (state.phase === "reflection") {
        showNotification({
          tone: "lime",
          title: locale === "en" ? "Strategy started" : "Réflexion lancée",
          message: locale === "en"
            ? "Team members can still discuss for 5 minutes."
            : "Les membres peuvent encore discuter pendant 5 minutes."
        });
      } else if (state.phase === "relay") {
        showNotification({
          tone: "signal",
          title: previousState.phase === "paused"
            ? locale === "en" ? "Relay resumed" : "Relais repris"
            : locale === "en" ? "Relay started" : "Relais lancé",
          message: locale === "en"
            ? "One player per team is at the keyboard. Total silence."
            : "Un joueur par équipe est au clavier. Silence total."
        });
      } else if (state.phase === "paused") {
        showNotification({
          tone: "fog",
          title: locale === "en" ? "Paused" : "Pause",
          message: locale === "en"
            ? "The timer is frozen until the organizer resumes it."
            : "Le chronomètre est gelé jusqu'à reprise par l'organisateur."
        });
      } else if (state.phase === "complete") {
        showNotification({
          tone: "lime",
          title: locale === "en" ? "Round complete" : "Manche terminée",
          message: locale === "en"
            ? "Coding is over. The judges can finalize scoring."
            : "Fin du codage. Le jury peut finaliser l'évaluation."
        });
      }
    } else if (state.phase === "relay" && previousState.currentSlice !== state.currentSlice) {
      showNotification({
        tone: "signal",
        title: locale === "en" ? "Rotation" : "Rotation",
        message: locale === "en"
          ? "Turn over. Rotate players at the keyboard."
          : "Fin de tranche. Rotation des joueurs au clavier."
      });
    }

    previousStateRef.current = state;
  }, [
    state.activeRelayOrder,
    state.currentSlice,
    state.isRunning,
    locale,
    state.phase,
    state.remainingMs
  ]);

  return notification;
}
