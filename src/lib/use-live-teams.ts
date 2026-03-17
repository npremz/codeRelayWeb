"use client";

import { useEffect, useState } from "react";
import { PublicTeam } from "@/lib/game-types";
import { demoTeams } from "@/lib/demo-game";

function getDemoPublicTeams(): PublicTeam[] {
  const now = new Date().toISOString();

  return demoTeams.map((team, index) => ({
    ...team,
    teamCode: `DEMO${index + 1}`,
    createdAt: now,
    updatedAt: now,
    locked: false
  }));
}

export function useLiveTeams() {
  const [teams, setTeams] = useState<PublicTeam[]>(() => getDemoPublicTeams());
  const [usingDemoData, setUsingDemoData] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/live", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { teams: PublicTeam[]; usingDemoData: boolean };

        if (!cancelled) {
          setTeams(payload.teams);
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

  return {
    teams,
    usingDemoData
  };
}
