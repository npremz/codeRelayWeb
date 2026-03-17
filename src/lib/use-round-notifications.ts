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

function getRelaySeatLabel(order: number | null) {
  if (order === 1) {
    return "A";
  }

  if (order === 2) {
    return "B";
  }

  if (order === 3) {
    return "C";
  }

  return null;
}

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
          message: "Les 3 membres peuvent encore discuter pendant 5 minutes."
        });
      } else if (state.phase === "relay") {
        const relaySeat = getRelaySeatLabel(state.activeRelayOrder);
        showNotification({
          tone: "signal",
          title: previousState.phase === "paused" ? "Relais repris" : "Relais lance",
          message: relaySeat ? `Joueur ${relaySeat} au clavier. Silence total.` : "Le relais est en cours."
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
      const relaySeat = getRelaySeatLabel(state.activeRelayOrder);
      showNotification({
        tone: "signal",
        title: "Rotation",
        message: relaySeat ? `Fin de tranche. Joueur ${relaySeat} prend le clavier.` : "Fin de tranche."
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
