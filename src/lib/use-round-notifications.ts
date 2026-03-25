"use client";

import { useEffect, useRef, useState } from "react";
import { RelayState } from "@/lib/game-types";

export type LiveNotification = {
  id: string;
  title: string;
  message: string;
  tone: "signal" | "lime" | "fog";
};

const DISPLAY_MS = 4500;
const WARNING_THRESHOLD_MS = 10000;

export function useRoundNotifications(state: RelayState) {
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
          title: "Fin imminente",
          message:
            state.phase === "relay"
              ? "Moins de 10 secondes avant la rotation suivante."
              : "Moins de 10 secondes avant la fin de la reflexion."
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
          title: "Reflexion lancee",
          message: "Les membres peuvent encore discuter pendant 5 minutes."
        });
      } else if (state.phase === "relay") {
        showNotification({
          tone: "signal",
          title: previousState.phase === "paused" ? "Relais repris" : "Relais lance",
          message: "Un joueur par equipe est au clavier. Silence total."
        });
      } else if (state.phase === "paused") {
        showNotification({
          tone: "fog",
          title: "Pause",
          message: "Le chronometre est gele jusqu'a reprise par l'organisateur."
        });
      } else if (state.phase === "complete") {
        showNotification({
          tone: "lime",
          title: "Manche terminee",
          message: "Fin du codage. Le jury peut finaliser l'evaluation."
        });
      }
    } else if (state.phase === "relay" && previousState.currentSlice !== state.currentSlice) {
      showNotification({
        tone: "signal",
        title: "Rotation",
        message: "Fin de tranche. Rotation des joueurs au clavier."
      });
    }

    previousStateRef.current = state;
  }, [
    state.activeRelayOrder,
    state.currentSlice,
    state.isRunning,
    state.phase,
    state.remainingMs
  ]);

  return notification;
}
