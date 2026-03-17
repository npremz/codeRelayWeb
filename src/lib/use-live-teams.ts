"use client";

import { useEffect, useState } from "react";
import { LiveTeamsResponse, PublicTeam, RoundControlState } from "@/lib/game-types";
import { defaultRoundState } from "@/lib/demo-game";

export function useLiveTeams() {
  const [teams, setTeams] = useState<PublicTeam[]>([]);
  const [round, setRound] = useState<RoundControlState>(defaultRoundState);
  const [usingDemoData, setUsingDemoData] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/live", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as LiveTeamsResponse;

        if (!cancelled) {
          setTeams(payload.teams);
          setRound(payload.round);
          setUsingDemoData(payload.usingDemoData);
        }
      } catch {
        return;
      }
    }

    load();
    const interval = window.setInterval(load, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  async function refresh() {
    try {
      const response = await fetch("/api/live", { cache: "no-store" });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as LiveTeamsResponse;
      setTeams(payload.teams);
      setRound(payload.round);
      setUsingDemoData(payload.usingDemoData);
    } catch {
      return;
    }
  }

  return {
    teams,
    round,
    usingDemoData,
    refresh
  };
}
