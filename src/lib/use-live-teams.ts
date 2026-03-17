"use client";

import { useEffect, useState } from "react";
import { LiveTeamsResponse, PublicTeam, RoundControlState } from "@/lib/game-types";
import { defaultRoundState } from "@/lib/demo-game";

export function useLiveTeams() {
  const [teams, setTeams] = useState<PublicTeam[]>([]);
  const [round, setRound] = useState<RoundControlState>(defaultRoundState);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [connected, setConnected] = useState(false);

  function applyPayload(payload: LiveTeamsResponse) {
    setTeams(payload.teams);
    setRound(payload.round);
    setUsingDemoData(payload.usingDemoData);
  }

  async function refresh() {
    try {
      const response = await fetch("/api/live", { cache: "no-store" });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as LiveTeamsResponse;
      applyPayload(payload);
    } catch {
      return;
    }
  }

  useEffect(() => {
    let disposed = false;
    let source: EventSource | null = null;

    void refresh();

    function connect() {
      const nextSource = new EventSource("/api/live/stream");
      source = nextSource;

      nextSource.addEventListener("open", () => {
        if (!disposed) {
          setConnected(true);
        }
      });

      nextSource.addEventListener("snapshot", (event) => {
        if (disposed) {
          return;
        }

        try {
          const payload = JSON.parse((event as MessageEvent<string>).data) as LiveTeamsResponse;
          applyPayload(payload);
          setConnected(true);
        } catch {
          return;
        }
      });

      nextSource.addEventListener("error", () => {
        if (disposed) {
          return;
        }

        setConnected(false);
        nextSource.close();
        window.setTimeout(() => {
          if (!disposed) {
            void refresh();
            connect();
          }
        }, 2000);
      });
    }

    connect();

    return () => {
      disposed = true;

      if (source) {
        source.close();
      }
    };
  }, []);

  return {
    teams,
    round,
    usingDemoData,
    connected,
    refresh
  };
}
